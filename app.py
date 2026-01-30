from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
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
    result = encode_face(await file.read())
    if result is None:
        return {"status": "skip"}

    return {
        "status": "ok",
        "embedding": result["embedding"],
        "pose": result["pose"]
    }

@app.post("/api/verify")
async def verify(file: UploadFile = File(...)):
    result = encode_face(await file.read())
    if result is None:
        return {"match": False}

    return verify_face(result["embedding"])

@app.post("/api/enroll/finalize")
async def enroll_finalize(data: dict):
    user = data.get("user")
    embeddings = [np.array(e, dtype=float) for e in data.get("embeddings", [])]

    if not user or len(embeddings) != 4:
        return {"status": "error"}

    for emb in embeddings:
        result = verify_face(emb)
        if result.get("match"):
            return {
                "status": "exists",
                "user": result.get("user")
            }

    user_dir = os.path.join("known_faces", user)
    os.makedirs(user_dir, exist_ok=True)

    for emb in embeddings:
        np.save(os.path.join(user_dir, f"{uuid.uuid4().hex}.npy"), emb)

    return {"status": "success"}
