
from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import numpy as np, os
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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.join(BASE_DIR, "known_faces")

import uuid

@app.post("/api/enroll")
async def enroll_temp(file: UploadFile = File(...)):
    result = encode_face(await file.read())

    if result is None:
        return {"status": "skip"}

    return {
        "status": "ok",
        "embedding": result["embedding"].tolist(),
        "pose": result["pose"]
    }


@app.post("/api/verify")
async def verify(file: UploadFile = File(...)):
    result = encode_face(await file.read())

    if result is None:
        return {"match": False}

    # ✅ ONLY pass the embedding
    return verify_face(result["embedding"])



@app.post("/api/enroll/finalize")
async def enroll_finalize(data: dict):
    user = data["user"]
    embeddings = [np.array(e) for e in data["embeddings"]]

    # check duplicate AFTER capture
    for emb in embeddings:
        result = verify_face(emb)
        if result.get("match"):
            if result.get("user") != user:
                return {
                    "status": "exists",
                    "user": result.get("user")
                }

    user_dir = os.path.join("known_faces", user)
    os.makedirs(user_dir, exist_ok=True)

    for emb in embeddings:
        np.save(os.path.join(user_dir, f"{uuid.uuid4().hex}.npy"), emb)

    return {"status": "success"}

