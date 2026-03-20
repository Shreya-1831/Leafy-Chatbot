import numpy as np
from PIL import Image, UnidentifiedImageError
import io


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Converts raw image bytes into a normalised (1, 224, 224, 3) float32 tensor
    ready for model.predict().

    Raises:
        ValueError: if the bytes cannot be decoded as an image.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, Exception) as e:
        raise ValueError(f"Could not decode image: {e}") from e

    image = image.resize((224, 224))
    image_array = np.array(image, dtype=np.float32) / 255.0
    return np.expand_dims(image_array, axis=0)