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
from process_video import YOLOModel, VGGModel, process_frame
from flask_cors import CORS
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app)

# Initialize YOLO and VGG models
yolo_model = YOLOModel(r"D:\CarInsuranceClaim\CDIModel\yolo\yolov5s.onnx")
vgg_model = VGGModel(r"D:\CarInsuranceClaim\CDIModel\vgg\vgg_damage_model.pth")

# Initialize Detectron2 model
cfg = get_cfg()
# cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config.yaml")  # Path to the downloaded config.yaml
# cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\model_final.pth"
cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config_detectron.yaml") 
cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\detectron_model.pth"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
predictor = DefaultPredictor(cfg)

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
    video_path = os.path.join(uploaded_videos_folder, video_file.filename)
    video_file.save(video_path)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = int(fps * 1)  # Process one frame per second

    processed_frames = []
    labels = []

    for i in range(0, frame_count, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break

        # Process frame using YOLO and VGG models
        processed_frame, label = process_frame(frame, yolo_model, vgg_model)

        if label == "No car detected":
            labels.append("No car detected")
            processed_frames.append(encode_image_to_base64(processed_frame))
            continue

        # Run damage detection on the processed frame
        damage_frame = detect_damage(processed_frame)

        # Save processed frame
        frame_filename = f"frame_{i}.jpg"
        frame_path = os.path.join(processed_frame_folder, frame_filename)
        cv2.imwrite(frame_path, damage_frame)

        # Encode for response
        processed_frames.append(encode_image_to_base64(damage_frame))
        labels.append(label)

    cap.release()

    return jsonify({
        "message": "Processing complete!",
        "frames": processed_frames,
        "labels": labels
    })

@app.route('/processed_frames/<filename>')
def serve_processed_frame(filename):
    return send_from_directory(processed_frame_folder, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
