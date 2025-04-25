# import torch
# import cv2
# import numpy as np
# import detectron2
# from detectron2.config import get_cfg
# from detectron2.engine import DefaultPredictor
# from detectron2.utils.visualizer import Visualizer
# from detectron2.data import MetadataCatalog

# # Load the trained model
# cfg = get_cfg()
# cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\config_parts.yaml")  # Config path
# cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\model_parts_identifier.pth"  # Model path
# cfg.MODEL.ROI_HEADS.NUM_CLASSES = 5  # Set the number of classes
# cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7  # Set a threshold for prediction

# # Initialize predictor
# predictor = DefaultPredictor(cfg)

# # Perform inference on an image
# image_path = r"D:\CarInsuranceClaim\CDIModel\data\test\60.jpg"  # Test image
# image = cv2.imread(image_path)
# outputs = predictor(image)

# # Visualize results
# v = Visualizer(image[:, :, ::-1], MetadataCatalog.get("dataset_val"), scale=0.5)
# out = v.draw_instance_predictions(outputs["instances"].to("cpu"))
# cv2.imshow("Result", out.get_image()[:, :, ::-1])
# cv2.waitKey(0)
# cv2.destroyAllWindows()



import os
import cv2
import torch
import numpy as np
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog

# Set up config
cfg = get_cfg()
cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\config_parts.yaml")  # Config path
cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\model_parts_identifier.pth"  # Model path
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 20  # Set the number of classes
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7  # Adjust threshold as needed
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"  # Use GPU if available

# Create predictor
predictor = DefaultPredictor(cfg)

# Perform inference on an image
image_path = r"D:\CarInsuranceClaim\CDIModel\data\test\60.jpg"  # Test image
image = cv2.imread(image_path)

# Run inference
outputs = predictor(image)

# Visualize results
visualizer = Visualizer(image[:, :, ::-1], metadata=MetadataCatalog.get(cfg.DATASETS.TEST[0]), scale=0.8)
vis_output = visualizer.draw_instance_predictions(outputs["instances"])

# Show result
cv2.imshow("Output", vis_output.get_image()[:, :, ::-1])
cv2.waitKey(0)
cv2.destroyAllWindows()
