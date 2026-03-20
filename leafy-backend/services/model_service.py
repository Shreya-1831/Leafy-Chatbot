import tensorflow as tf
import json
import numpy as np
from utils.image_utils import preprocess_image

model = None
class_labels = None


def load_model():
    global model, class_labels

    model = tf.keras.models.load_model("ml/final_model.keras", compile=False)
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    with open("ml/class_indices.json", "r") as f:
        class_indices = json.load(f)
        class_labels = {v: k for k, v in class_indices.items()}


def predict_disease(image_bytes: bytes) -> tuple[str, float]:
    """
    Returns (predicted_class, confidence).
    Called synchronously from predict.py's event_generator thread
    before streaming begins — model inference is CPU-bound so
    it's fine to run it once before the SSE loop starts.
    """
    image_tensor = preprocess_image(image_bytes)
    prediction = model.predict(image_tensor)
    predicted_index = int(np.argmax(prediction[0]))
    predicted_class = class_labels.get(predicted_index, "unknown")
    confidence = float(np.max(prediction[0]))
    return predicted_class, confidence