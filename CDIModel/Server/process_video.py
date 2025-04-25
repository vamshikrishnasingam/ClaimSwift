import cv2
import numpy as np
import torch
from torchvision import models, transforms
from PIL import Image
import onnxruntime as ort


class YOLOModel:
    def __init__(self, weights_path):
        self.session = ort.InferenceSession(weights_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def detect_objects(self, frame):
        h, w = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (640, 640), swapRB=True, crop=False)
        outputs = self.session.run([self.output_name], {self.input_name: blob.astype(np.float32)})[0]

        for detection in outputs[0]:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            if confidence > 0.5 and class_id == 2:
                box = detection[:4] * np.array([w, h, w, h])
                x, y, bw, bh = box.astype("int")
                x1, y1 = max(0, int(x - bw / 2)), max(0, int(y - bh / 2))
                x2, y2 = min(w, int(x + bw / 2)), min(h, int(y + bh / 2))
                print(f"Bounding Box: {(x1, y1, x2, y2)}")
                return frame[y1:y2, x1:x2], (x1, y1, x2, y2)
        return None, None

class VGGModel:
    def __init__(self, model_path):
        self.model = models.vgg16(pretrained=False)
        self.model.classifier[6] = torch.nn.Linear(4096, 3)
        self.model.load_state_dict(torch.load(model_path, map_location='cpu'))
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def classify_objects(self, img):
        img_tensor = self.transform(Image.fromarray(img)).unsqueeze(0)
        with torch.no_grad():
            outputs = self.model(img_tensor)
            _, preds = torch.max(outputs, 1)
        print(preds)
        return preds.item()
def process_frame(frame, yolo_model, vgg_model):
    car_roi, bbox = yolo_model.detect_objects(frame)
    if car_roi is None:
        print("No car detected.")
        return frame, "No car detected"

    classified_obj = vgg_model.classify_objects(car_roi)
    label = f"{classified_obj}"

    # Check if bbox is valid
    if bbox:
        cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
        cv2.putText(frame, label, (bbox[0], bbox[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    else:
        print("No bounding box detected.")
    
    return frame, label