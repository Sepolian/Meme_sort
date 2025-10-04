
import sys
import json
import torch
from transformers import pipeline
from PIL import Image
import numpy as np

def extract_features(image_path, pipeline_instance):
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(json.dumps({"error": f"Error opening image {image_path}: {e}"}), file=sys.stderr)
        return None

    outputs = pipeline_instance(image)
    feature_vector = np.array(outputs[0]).flatten().tolist()
    return feature_vector

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python extract_vector.py <image_path>"}), file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        device_id = 0 if torch.cuda.is_available() else -1
        pipe = pipeline(
            "image-feature-extraction",
            model="facebook/dinov2-base",
            device=device_id
        )
    except Exception as e:
        print(json.dumps({"error": f"Failed to load pipeline: {e}"}), file=sys.stderr)
        sys.exit(1)

    features = extract_features(image_path, pipe)

    if features:
        print(json.dumps(features))
