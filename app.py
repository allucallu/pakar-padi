from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io


app = Flask(__name__)

# Load model
model = tf.keras.models.load_model('model_final2.keras')

# Daftar label (sesuaikan dengan kelas Anda)
labels = ['Bacterial Leaf Blight', 'Brown Spot', 'Leaf Blast']

# Fungsi untuk preprocess gambar
def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize((224, 224))  # Sesuaikan dengan input model
    image_array = np.array(image) / 255.0  # Normalisasi jika perlu
    return np.expand_dims(image_array, axis=0)

@app.route("/", methods=["GET"])
def home():
    return "🚀 Backend Flask untuk Klasifikasi Penyakit Padi siap digunakan."


@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        image_bytes = file.read()
        processed_image = preprocess_image(image_bytes)
        predictions = model.predict(processed_image)[0]

        # Susun semua hasil dengan label dan confidence
        results = [
            {"label": labels[i], "confidence": float(predictions[i])}
            for i in range(len(labels))
        ]

        # Urutkan dari yang tertinggi
        results = sorted(results, key=lambda x: x["confidence"], reverse=True)

        return jsonify({"results": results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)