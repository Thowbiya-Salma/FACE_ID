
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

@app.post("/api/enroll")
async def enroll(
    file: UploadFile = File(...),
    user: str = Form(...)
):
    emb = encode_face(await file.read())

    if emb is None:
        return {"status": "fail"}

    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

    file_path = os.path.join(KNOWN_FACES_DIR, f"{user}.npy")
    np.save(file_path, emb)

    return {"status": "success"}



@app.post("/api/verify")
async def verify(file: UploadFile = File(...)):
    emb = encode_face(await file.read())
    result = verify_face(emb)
    return result
