from flask import Flask, request, jsonify, send_from_directory
import cv2
import os
import base64
import torch
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog
import numpy as np
from model_pth import parts_model
from process_video import YOLOModel, VGGModel, process_frame
from flask_cors import CORS
import matplotlib.pyplot as plt
import mysql.connector as connector
from werkzeug.utils import secure_filename
from collections import Counter
import numpy as np
import math

app = Flask(__name__)
CORS(app)
# Initialize YOLO and VGG models
yolo_model = YOLOModel(r"D:\CarInsuranceClaim\CDIModel\yolo\yolov5s.onnx")
vgg_model = VGGModel(r"D:\CarInsuranceClaim\CDIModel\vgg\vgg_damage_model.pth")
# Initialize Detectron2 model
cfg = get_cfg()
cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config_detectron.yaml")
cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\detectron_model.pth"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
predictor = DefaultPredictor(cfg)

# Initialize YOLO model for damage detection
parts_identifier_model = parts_model

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Jayanth@12$',
    'database': 'vehicle_damage_detection'
}

def connect_to_db():
    try:
        connection = connector.connect(**db_config)
        return connection
    except connector.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def get_part_prices(car_name, car_model, class_counts, bounding_boxes):
    connection = connect_to_db()
    if connection:
        try:
            with connection.cursor(dictionary=True) as cursor:
                prices = {}
                total_area = sum(box[2] * box[3] for box in bounding_boxes)  # Total area of all bounding boxes
                for class_id, box in zip(class_counts.keys(), bounding_boxes):
                    part_name = get_part_name_from_id(class_id)
                    if part_name:
                        cursor.execute(
                            "SELECT price FROM car_models WHERE brand = %s AND model = %s AND part = %s",
                            (car_name, car_model, part_name)
                        )
                        price_data = cursor.fetchone()
                        if price_data:
                            price_per_part = float(price_data['price'])  # Ensure price is a standard float
                            box_area = float(box[2] * box[3])  # Width * Height, converted to float
                            percentage = float((box_area / total_area) * 100)  # Convert to standard float

                            # Determine repair or replace
                            if part_name in ["Light", "Windshield"]:
                                # Fixed price for Light and Windshield
                                total_price = price_per_part
                                repair_or_replace = "replace"
                            else:
                                if percentage > 80:
                                    # Replace the part (full price)
                                    total_price = price_per_part
                                    repair_or_replace = "replace"
                                else:
                                    # Repair the part (percentage of price)
                                    total_price = price_per_part * (percentage / 100)
                                    total_price = math.ceil(total_price)
                                    repair_or_replace = "repair"

                            prices[part_name] = {
                                'price': price_per_part,
                                'total': float(total_price),  # Ensure total is a standard float
                                'repair_or_replace': repair_or_replace,
                                'percentage': percentage
                            }
                return prices
        except connector.Error as e:
            print(f"Error executing query: {e}")
            return {}
    return {}

def get_part_name_from_id(class_id):
    class_names = ['Bonnet', 'Bumper', 'Dickey', 'Door', 'Fender', 'Light', 'Windshield']
    if 0 <= class_id < len(class_names):
        return class_names[int(class_id)]
    return None

# Folder setup
uploaded_videos_folder = './uploaded_videos'
processed_frame_folder = './processed_frames'

os.makedirs(uploaded_videos_folder, exist_ok=True)
os.makedirs(processed_frame_folder, exist_ok=True)

def encode_image_to_base64(image):
    """Convert an image to a Base64 string."""
    _, img_encoded = cv2.imencode('.jpg', image)
    return base64.b64encode(img_encoded).decode('utf-8')

def detect_damage(frame):
    """Run the Detectron2 model on the processed frame and return the annotated image."""
    outputs = predictor(frame)

    # Extract predictions
    instances = outputs["instances"]
    scores = instances.scores
    pred_classes = instances.pred_classes
    pred_boxes = instances.pred_boxes

    # Visualize results
    v = Visualizer(frame[:, :, ::-1], MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=0.5)
    out = v.draw_instance_predictions(instances.to("cpu"))

    # Annotate the damage on the frame
    damage_count = len(pred_classes)
    for i in range(damage_count):
        score = scores[i].item()
        label = pred_classes[i].item()
        damage_text = f"Damage: {label}, {score*100:.2f}%"

        # Get bounding box
        box = pred_boxes[i].tensor.cpu().numpy().flatten()
        top_left = (int(box[0]), int(box[1]))
        bottom_right = (int(box[2]), int(box[3]))

        # Draw text
        out.ax.text(top_left[0], top_left[1] - 10, damage_text, color='white', fontsize=10,
                    bbox=dict(facecolor='black', alpha=0.5, boxstyle='round,pad=0.3'))

    # Display total damage parts at the bottom
    damage_count_text = f"Total Damage Parts: {damage_count}"
    out.ax.text(0.5, 0.05, damage_count_text, color='white', fontsize=10, ha='center', va='bottom',
                transform=out.ax.transAxes, bbox=dict(facecolor='black', alpha=0.7, boxstyle='round,pad=0.5'))

    return out.get_image()[:, :, ::-1]

@app.route('/upload_video', methods=['POST'])
def upload_video():
    """Upload and process video, then run damage detection on frames."""
    print('Uploading video')
    video_file = request.files['video']
    car_name = request.form.get('car_name')
    car_model = request.form.get('car_model')

    if not car_name or not car_model:
        return jsonify({'error': 'Car name and model are required.'}), 400

    video_path = os.path.join(uploaded_videos_folder, video_file.filename)
    video_file.save(video_path)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = int(fps * 1)  # Process one frame per second

    max_detected_parts = 0  # Track the maximum number of detected parts
    best_frame_data = None  # Store data for the frame with the most detected parts

    for i in range(0, frame_count, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break

        # Process frame using YOLO and VGG models
        processed_frame, label = process_frame(frame, yolo_model, vgg_model)

        if label == "No car detected":
            continue  # Skip frames with no car detected

        # Save the frame temporarily
        temp_frame_path = os.path.join(processed_frame_folder, f"temp_frame_{i}.jpg")
        cv2.imwrite(temp_frame_path, processed_frame)
        result = parts_identifier_model(temp_frame_path)
        detected_objects = result[0].boxes
        class_ids = [box.cls.item() for box in detected_objects]
        bounding_boxes = [box.xywh.cpu().numpy().flatten() for box in detected_objects]  # Get bounding boxes
        bounding_boxes = [box.astype(float) for box in bounding_boxes]  # Convert to standard float
        class_counts = Counter(class_ids)

        # Count the total number of detected parts
        total_detected_parts = sum(class_counts.values())

        # Check if this frame has the highest number of detected parts
        if total_detected_parts > max_detected_parts:
            max_detected_parts = total_detected_parts

            # Fetch part prices from the database
            part_prices = get_part_prices(car_name, car_model, class_counts, bounding_boxes)

            # Save the detected image
            detected_image_path = os.path.join(processed_frame_folder, f"detected_frame_{i}.jpg")
            result[0].save(detected_image_path)

            # Encode for response
            with open(detected_image_path, "rb") as img_file:
                detected_image_base64 = base64.b64encode(img_file.read()).decode('utf-8')

            # Generate masked image
            masked_image = detect_damage(processed_frame)
            masked_image_base64 = encode_image_to_base64(masked_image)

            # Store the best frame data
            best_frame_data = {
                "frame": detected_image_base64,
                "label": label,
                "part_prices": part_prices,
                "masked_image": masked_image_base64,
                "total_detected_parts": total_detected_parts
            }

    cap.release()

    if best_frame_data:
        return jsonify({
            "message": "Processing complete!",
            "best_frame": best_frame_data
        })
    else:
        return jsonify({
            "message": "No car detected in any frame. Please Upload a Video that belongs to a Car"
        })

@app.route('/processed_frames/<filename>')
def serve_processed_frame(filename):
    return send_from_directory(processed_frame_folder, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)