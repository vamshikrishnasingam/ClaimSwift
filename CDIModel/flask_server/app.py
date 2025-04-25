from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import os
from ultralytics import YOLO
from collections import Counter
import mysql.connector as connector
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load YOLO model
model_path = r"D:\CarInsuranceClaim\CDIModel\flask_server\models\model weights\best.pt"
model = YOLO(model_path)

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password' : 'Jayanth@12$',
    'database' : 'vehicle_damage_detection'
}

def connect_to_db():
    try:
        connection = connector.connect(**db_config)
        return connection
    except connector.Error as e:
        print(f"Error connecting to database: {e}")
        return None

@app.route('/detect_damage', methods=['POST'])
def detect_damage():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400

    # Get car name and model from the request
    car_name = request.form.get('car_name')
    car_model = request.form.get('car_model')
    if not car_name or not car_model:
        return jsonify({'error': 'Car name and model are required.'}), 400

    # Save the uploaded image
    image_path = os.path.join('static', 'uploaded_image.jpg')
    file.save(image_path)

    # Make predictions using YOLO
    result = model(image_path)
    detected_objects = result[0].boxes
    class_ids = [box.cls.item() for box in detected_objects]
    class_counts = Counter(class_ids)

    # Save the image with detections
    detected_image_path = os.path.join('static', 'detected_image.jpg')
    result[0].save(detected_image_path)

    # Fetch part prices from the database
    part_prices = get_part_prices(car_name, car_model, class_counts)

    return jsonify({
        'original_image': 'uploaded_image.jpg',
        'detected_image': 'detected_image.jpg',
        'part_prices': part_prices
    })

def get_part_prices(car_name, car_model, class_counts):
    connection = connect_to_db()
    if connection:
        try:
            with connection.cursor(dictionary=True) as cursor:
                prices = {}
                for class_id, count in class_counts.items():
                    part_name = get_part_name_from_id(class_id)
                    if part_name:
                        cursor.execute(
                            "SELECT price FROM car_models WHERE brand = %s AND model = %s AND part = %s",
                            (car_name, car_model, part_name)
                        )
                        price_data = cursor.fetchone()
                        if price_data:
                            price_per_part = price_data['price']
                            total_price = price_per_part * count
                            prices[part_name] = {'price': price_per_part, 'total': total_price}
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)