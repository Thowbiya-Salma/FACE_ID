from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from collections import Counter
import numpy as np
import os
import uuid

from ml.face import encode_face, verify_face

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/enroll", response_class=HTMLResponse)
def enroll_page(request: Request):
    return templates.TemplateResponse("enroll.html", {"request": request})

@app.get("/verify", response_class=HTMLResponse)
def verify_page(request: Request):
    return templates.TemplateResponse("verify.html", {"request": request})

@app.post("/api/enroll")
async def enroll_temp(file: UploadFile = File(...)):
    embedding = encode_face(await file.read())
    if embedding is None:
        return {"status": "skip"}

    return {
        "status": "ok",
        "embedding": embedding
    }

@app.post("/api/verify")
async def verify(file: UploadFile = File(...)):
    embedding = encode_face(await file.read())
    if embedding is None:
        return {"match": False}

    return verify_face(embedding)


@app.post("/api/enroll/finalize")
async def enroll_finalize(data: dict):
    user = data["user"]
    embeddings = [np.array(e) for e in data["embeddings"]]

    matches = []

    # 🔍 STRICT duplicate check
    for emb in embeddings:
        result = verify_face(emb, threshold=0.40)  # STRICT threshold
        if result.get("match"):
            matches.append(result["user"])

    # ✅ Require at least 2 matches to reject
    if matches:
        most_common_user, count = Counter(matches).most_common(1)[0]

        if count >= 4 and most_common_user != user:
            return {
                "status": "exists",
                "user": most_common_user
            }

    # 💾 Save embeddings
    user_dir = os.path.join("known_faces", user)
    os.makedirs(user_dir, exist_ok=True)

    for emb in embeddings:
        np.save(os.path.join(user_dir, f"{uuid.uuid4().hex}.npy"), emb)

    return {"status": "success"}
