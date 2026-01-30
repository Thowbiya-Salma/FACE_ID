import face_recognition
import numpy as np
import cv2
import os

def encode_face(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return None

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    h, w, _ = rgb.shape
    if w > 800:
        scale = 800 / w
        rgb = cv2.resize(rgb, (int(w * scale), int(h * scale)))

    locations = face_recognition.face_locations(rgb, model="hog")
    if not locations:
        return None

    encodings = face_recognition.face_encodings(rgb, locations)
    if not encodings:
        return None

    return encodings[0].tolist()

def verify_face(embedding, threshold=0.6, min_matches=3):
    if embedding is None:
        return {"match": False}

    # normalize input
    if isinstance(embedding, dict):
        embedding = embedding.get("embedding")

    if isinstance(embedding, list):
        embedding = np.array(embedding)

    if not isinstance(embedding, np.ndarray):
        return {"match": False}

    base_dir = "known_faces"
    if not os.path.exists(base_dir):
        return {"match": False}

    # 🔁 check each user
    for user in os.listdir(base_dir):
        user_dir = os.path.join(base_dir, user)
        if not os.path.isdir(user_dir):
            continue

        match_count = 0
        total = 0

        for file in os.listdir(user_dir):
            if not file.endswith(".npy"):
                continue

            known = np.load(os.path.join(user_dir, file))
            total += 1

            dist = np.linalg.norm(known.astype(float) - embedding.astype(float))

            if dist < threshold:
                match_count += 1

        # ✅ REQUIRE AT LEAST 2 MATCHES
        if match_count >= min_matches:
            return {
                "match": True,
                "user": user,
                "matches": match_count,
                "total": total
            }

    return {"match": False}
