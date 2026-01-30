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

    landmarks = face_recognition.face_landmarks(rgb, locations)
    pose = estimate_pose(landmarks[0])

    return {
        "embedding": encodings[0].tolist(),
        "pose": pose
    }

def verify_face(embedding):
    if embedding is None:
        return {"match": False}

    embedding = np.array(embedding, dtype=float)

    base_dir = "known_faces"
    if not os.path.exists(base_dir):
        return {"match": False}

    for user in os.listdir(base_dir):
        user_dir = os.path.join(base_dir, user)
        if not os.path.isdir(user_dir):
            continue

        for file in os.listdir(user_dir):
            if not file.endswith(".npy"):
                continue

            known = np.load(os.path.join(user_dir, file))

            dist = np.linalg.norm(known - embedding)

            if dist < 0.6:
                return {
                    "match": True,
                    "user": user,
                    "confidence": float(1 - dist)
                }

    return {"match": False}

def estimate_pose(landmarks):
    nose = landmarks["nose_bridge"][0]
    left_eye = landmarks["left_eye"][0]
    right_eye = landmarks["right_eye"][3]

    eye_center_x = (left_eye[0] + right_eye[0]) / 2
    eye_center_y = (left_eye[1] + right_eye[1]) / 2

    dx = nose[0] - eye_center_x
    dy = nose[1] - eye_center_y

    if dx > 15:
        return "right"
    elif dx < -15:
        return "left"
    elif dy < -10:
        return "up"
    else:
        return "center"
