# import torch
# import cv2
# import matplotlib.pyplot as plt
# from detectron2.config import get_cfg
# from detectron2.engine import DefaultPredictor
# from detectron2.utils.visualizer import Visualizer
# from detectron2.data import MetadataCatalog

# # Load the configuration
# cfg = get_cfg()
# cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\config_parts.yaml")  # Config path
# cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\model_parts_identifier.pth"  # Model path
# cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7  # Set threshold for inference
# cfg.MODEL.DEVICE = "cpu"  # Set to "cuda" if GPU is available

# # Initialize the predictor
# predictor = DefaultPredictor(cfg)

# # Load and preprocess the image
# image_path = r"D:\CarInsuranceClaim\CDIModel\data\test\60.jpg"  # Test image
# image = cv2.imread(image_path)

# # Perform inference
# outputs = predictor(image)

# # Get metadata
# metadata = MetadataCatalog.get(cfg.DATASETS.TEST[0]) if cfg.DATASETS.TEST else None

# # Visualize the results
# v = Visualizer(image[:, :, ::-1], metadata=metadata, scale=0.5)
# out = v.draw_instance_predictions(outputs["instances"])

# # Display the image
# plt.figure(figsize=(12, 12))
# plt.imshow(out.get_image()[:, :, ::-1])
# plt.axis("off")
# plt.show()


import cv2
import glob
import torch
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2.utils.visualizer import ColorMode

# Load saved model configuration
cfg = get_cfg()
cfg.merge_from_file(r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\config.yaml")  # Load config file
cfg.MODEL.WEIGHTS = r"D:\CarInsuranceClaim\CDIModel\V_MODELS\parts\parts_model_final.pth"  # Load trained model weights
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # Confidence threshold

# Create predictor
predictor = DefaultPredictor(cfg)

# Define class names as per dataset
class_names = [
    "Car-parts", "Car boot", "Car hood", "Driver-s door - -F-R-", "Fender - -F-L-",
    "Fender - -F-R-", "Fender - -R-L-", "Fender - -R-R-", "Front bumper",
    "Headlight - -L-", "Headlight - -R-", "Passenger-s door - -F-L-", "Passenger-s door - -R-L-",
    "Passenger-s door - -R-R-", "Rear bumper", "Rear light - -L-", "Rear light - -R-",
    "Side bumper - -L-", "Side bumper - -R-", "Side mirror - -L-", "Side mirror - -R-"
]

test_metadata = MetadataCatalog.get("my_dataset_test")
test_metadata.thing_classes = class_names  # Assign class names

# Path to local test dataset (Change this to your actual test image folder)
test_images_path = "D:/CarInsuranceClaim/CDIModel/data/test/*.jpg"

# Run inference on test images
for image_path in glob.glob(test_images_path):
    img = cv2.imread(image_path)
    outputs = predictor(img)

    instances = outputs["instances"].to("cpu")
    pred_classes = instances.pred_classes.numpy()
    pred_boxes = instances.pred_boxes.tensor.numpy()
    scores = instances.scores.numpy()

    # Draw bounding boxes with labels and confidence scores
    v = Visualizer(img[:, :, ::-1], metadata=test_metadata, scale=1.0, instance_mode=ColorMode.IMAGE)

    for i, box in enumerate(pred_boxes):
        x1, y1, x2, y2 = map(int, box)
        class_name = class_names[pred_classes[i]]
        score = scores[i] * 100  # Convert to percentage

        label = f"{class_name} {int(score)}%"
        color = (0, 255, 0)  # Green box for better visibility

        # Draw rectangle
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        # Put label text
        cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Save and display the output image
    output_image_path = "output_" + image_path.split("/")[-1]
    cv2.imwrite(output_image_path, img)
    print(f"Saved: {output_image_path}")

    # Optionally display the image
    cv2.imshow("Predictions", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
