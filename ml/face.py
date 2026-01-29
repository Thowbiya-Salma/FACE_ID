
import face_recognition, numpy as np, cv2, os

def encode_face(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return None
    
    enc = face_recognition.face_encodings(img)
    if not enc:
        raise ValueError("No face detected")
    return enc[0]

def verify_face(embedding):
    if embedding is None:
        return {"status": "fail"}

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    folder = os.path.join(BASE_DIR, "known_faces")

    if not os.path.exists(folder):
        return {"status": "fail"}

    for file in os.listdir(folder):
        if file.endswith(".npy"):
            known = np.load(os.path.join(folder, file))
            dist = np.linalg.norm(known - embedding)

            if dist < 0.6:
                return {
                    "status": "success",
                    "match": True,
                    "user": file.replace(".npy", ""),
                    "confidence": float(1 - dist)
                }

    return {"status": "fail"}


