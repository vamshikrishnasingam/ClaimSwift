# import torch
# from detectron2.config import get_cfg
# from detectron2.engine import DefaultPredictor

# # Load the configuration
# cfg = get_cfg()
# cfg.merge_from_file("C:/Users/jayanth/Desktop/project/config.yaml")  # Path to the downloaded config.yaml
# cfg.MODEL.WEIGHTS = r"C:\Users\jayanth\Desktop\project\model_final.pth"
# cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7  # Set threshold for inference
# cfg.MODEL.DEVICE = "cpu"  # Use CPU if no GPU is available

# # Initialize the predictor
# predictor = DefaultPredictor(cfg)

# # Example inference
# import cv2
# from detectron2.utils.visualizer import Visualizer
# from detectron2.data import MetadataCatalog

# image_path = r"C:\Users\jayanth\Desktop\project\data\val\78.jpg"  # Replace with your test image path
# image = cv2.imread(image_path)
# outputs = predictor(image)

# # Visualize the results
# v = Visualizer(image[:, :, ::-1], MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=0.5)
# out = v.draw_instance_predictions(outputs["instances"])

# import matplotlib.pyplot as plt
# plt.figure(figsize=(12, 12))
# plt.imshow(out.get_image()[:, :, ::-1])
# plt.axis("off")
# plt.show()


import torch
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor

# Load the configuration
cfg = get_cfg()
#cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config.yaml")  # Path to the downloaded config.yaml  
cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\config_detectron.yaml") 
cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\damage\detectron_model.pth"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7  # Set threshold for inference
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"  # Use GPU if available, else fall back to CPU

# Initialize the predictor
predictor = DefaultPredictor(cfg)

# Example inference
import cv2
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog

image_path = r"D:\CarInsuranceClaim\CDIModel\data\test\45.jpg"  # Replace with your test image path
image = cv2.imread(image_path)
outputs = predictor(image)

# Get the class labels and scores
instances = outputs["instances"]
scores = instances.scores
pred_classes = instances.pred_classes
pred_boxes = instances.pred_boxes

# Visualize the results
v = Visualizer(image[:, :, ::-1], MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=0.5)

# Draw the instance predictions
out = v.draw_instance_predictions(instances.to("cpu"))

# Track the number of damaged parts
damage_count = len(pred_classes)

# Get the damage type and scores
for i in range(len(pred_classes)):
    score = scores[i].item()
    label = pred_classes[i].item()
    damage_text = f"Damage: {label}, {score*100:.2f}%"

    # Get bounding box for placement of text
    box = pred_boxes[i].tensor.cpu().numpy().flatten()
    top_left = (int(box[0]), int(box[1]))
    bottom_right = (int(box[2]), int(box[3]))

    # Place the text on the image
    out.ax.text(top_left[0], top_left[1] - 10, damage_text, color='white', fontsize=10, 
                bbox=dict(facecolor='black', alpha=0.5, boxstyle='round,pad=0.3'))

# Display the number of damage parts at a visible location
damage_count_text = f"Total Damage Parts: {damage_count}"
out.ax.text(0.5, 0.95, damage_count_text, color='white', fontsize=20, 
            ha='center', va='top', transform=out.ax.transAxes,
            bbox=dict(facecolor='black', alpha=0.7, boxstyle='round,pad=0.5'))

import matplotlib.pyplot as plt
plt.figure(figsize=(12, 12))
plt.imshow(out.get_image()[:, :, ::-1])
plt.axis("off")
plt.show()




