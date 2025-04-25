from flask import Flask, request, jsonify, send_from_directory
import cv2
import os
import base64
import torch
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog
from flask_cors import CORS
from detectron2.utils.visualizer import ColorMode
import traceback
from process_video import YOLOModel, VGGModel, process_frame
from flask_cors import CORS
import matplotlib.pyplot as plt
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize YOLO and VGG models
yolo_model = YOLOModel(r"D:\CarInsuranceClaim\CDIModel\yolo\yolov5s.onnx")
vgg_model = VGGModel(r"D:\CarInsuranceClaim\CDIModel\vgg\vgg_damage_model.pth")

# Initialize Detectron2 model for damage detection
damage_cfg = get_cfg()
damage_cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config_detectron.yaml")
damage_cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\detectron_model.pth"
damage_cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
damage_cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
damage_predictor = DefaultPredictor(damage_cfg)

# Initialize Detectron2 model for car part detection
parts_cfg = get_cfg()
parts_cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\config.yaml")
parts_cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\parts_model_final.pth"
parts_cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
parts_cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
parts_predictor = DefaultPredictor(parts_cfg)

# Define car part class names
class_names = [
    "Car-parts", "Car boot", "Car hood", "Driver-s door - -F-R-", "Fender - -F-L-",
    "Fender - -F-R-", "Fender - -R-L-", "Fender - -R-R-", "Front bumper",
    "Headlight - -L-", "Headlight - -R-", "Passenger-s door - -F-L-", "Passenger-s door - -R-L-",
    "Passenger-s door - -R-R-", "Rear bumper", "Rear light - -L-", "Rear light - -R-",
    "Side bumper - -L-", "Side bumper - -R-", "Side mirror - -L-", "Side mirror - -R-"
]

# Assign class names to metadata
parts_metadata = MetadataCatalog.get("my_dataset_test")
parts_metadata.thing_classes = class_names

# Folder setup
uploaded_videos_folder = './uploaded_videos'
processed_frame_folder = './processed_frames'

os.makedirs(uploaded_videos_folder, exist_ok=True)
os.makedirs(processed_frame_folder, exist_ok=True)

def encode_image_to_base64(image):
    """Convert an image to a Base64 string."""
    try:
        _, img_encoded = cv2.imencode('.jpg', image)
        if img_encoded is None:
            raise ValueError("Failed to encode image")
        return base64.b64encode(img_encoded).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

def detect_damage(frame):
    """Run the Detectron2 model on the processed frame and return the annotated image."""
    outputs = damage_predictor(frame)

    # Extract predictions
    instances = outputs["instances"]
    scores = instances.scores
    pred_classes = instances.pred_classes
    pred_boxes = instances.pred_boxes

    # Visualize results
    v = Visualizer(frame[:, :, ::-1], MetadataCatalog.get(damage_cfg.DATASETS.TEST[0]), scale=0.5)
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

def detect_parts(frame):
    """Run the car part detection model on the frame and return the annotated image."""
    # Ensure the frame is a valid NumPy array in BGR format
    if frame is None or not isinstance(frame, np.ndarray):
        print("Invalid frame detected in detect_parts")
        return frame

    # Ensure the frame is contiguous and of type uint8
    frame = np.ascontiguousarray(frame, dtype=np.uint8)

    # Run the part detection model
    outputs = parts_predictor(frame)

    # Extract predictions
    instances = outputs["instances"].to("cpu")
    pred_classes = instances.pred_classes.numpy()
    pred_boxes = instances.pred_boxes.tensor.numpy()
    scores = instances.scores.numpy()

    # Get frame dimensions
    frame_height, frame_width = frame.shape[:2]

    # Draw bounding boxes with labels and confidence scores
    for i, box in enumerate(pred_boxes):
        x1, y1, x2, y2 = map(int, box)

        # Validate bounding box coordinates
        if not (0 <= x1 < frame_width and 0 <= y1 < frame_height and 0 <= x2 < frame_width and 0 <= y2 < frame_height):
            print(f"Invalid bounding box: {box}, frame dimensions: {frame_width}x{frame_height}")
            continue

        class_name = class_names[pred_classes[i]]
        score = scores[i] * 100  # Convert to percentage

        label = f"{class_name} {int(score)}%"
        color = (0, 255, 0)  # Green box for better visibility

        # Draw rectangle
        try:
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        except Exception as e:
            print(f"Error drawing rectangle: {e}")
            continue

        # Put label text
        try:
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        except Exception as e:
            print(f"Error drawing text: {e}")
            continue

    return frame

@app.route('/upload_video', methods=['POST'])
def upload_video():
    """Upload and process video, then run damage and part detection on frames."""
    if 'video' not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        video_path = os.path.join(uploaded_videos_folder, video_file.filename)
        video_file.save(video_path)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return jsonify({"error": "Failed to open video file"}), 400

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = int(fps * 1)  # Process one frame per second

        processed_frames = []
        labels = []

        for i in range(0, frame_count, frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret or frame is None:
                print(f"Skipping frame {i} (empty or corrupted)")
                continue

            print(f"Processing frame {i} with dimensions: {frame.shape}")

            # Process frame using YOLO and VGG models
            processed_frame, label = process_frame(frame, yolo_model, vgg_model)

            if label == "No car detected":
                labels.append("No car detected")
                encoded_frame = encode_image_to_base64(processed_frame)
                if encoded_frame:
                    processed_frames.append(encoded_frame)
                continue

            # Run damage detection on the processed frame
            try:
                damage_frame = detect_damage(processed_frame)
            except Exception as e:
                print(f"Error in damage detection: {e}")
                print(traceback.format_exc())
                continue

            # Debug: Check damage frame type and shape
            print(f"Damage frame type: {type(damage_frame)}")
            print(f"Damage frame shape: {damage_frame.shape}")

            # Run car part detection on the damage frame
            try:
                final_frame = detect_parts(damage_frame)
            except Exception as e:
                print(f"Error in part detection: {e}")
                print(traceback.format_exc())
                continue

            # Encode the final frame
            encoded_frame = encode_image_to_base64(final_frame)
            if encoded_frame:
                processed_frames.append(encoded_frame)
                labels.append(label)
                print(f"Frame {i} processed and added to response")
            else:
                print(f"Frame {i} could not be encoded, skipping...")

        cap.release()

        return jsonify({
            "message": "Processing complete!",
            "frames": processed_frames,
            "labels": labels
        })

    except Exception as e:
        print(f"Unexpected error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/processed_frames/<filename>')
def serve_processed_frame(filename):
    return send_from_directory(processed_frame_folder, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)