// ==============================
// CONFIG
// ==============================
const MAX_SAMPLES = 4;
const CAPTURE_INTERVAL = 1500;

// ==============================
// STATE
// ==============================
let embeddings = [];
let captureInterval = null;
let isCapturing = false;
let isFinished = false;

// ==============================
// AUTO REGISTER
// ==============================
async function autoRegister() {
  embeddings = [];
  isCapturing = false;
  isFinished = false;

  const user = sessionStorage.getItem("username");
  if (!user) {
    document.getElementById("status").innerText = "Username missing";
    return;
  }

  document.getElementById("status").innerText =
    "Scanning… slowly turn your head";

  captureInterval = setInterval(captureOnce, CAPTURE_INTERVAL);
}

// ==============================
// CAPTURE ONE FRAME
// ==============================
async function captureOnce() {
  if (isCapturing || isFinished) return;
  if (embeddings.length >= MAX_SAMPLES) return;

  isCapturing = true;

  try {
    const blob = await captureFrame();
    if (!blob) return;

    const form = new FormData();
    form.append("file", blob);

    const res = await fetch("/api/enroll", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    if (data.status !== "ok") return;

    embeddings.push(data.embedding);
    flashRing();

    document.getElementById("status").innerText =
      `Captured ${embeddings.length} / ${MAX_SAMPLES}`;

    if (embeddings.length === MAX_SAMPLES) {
      isFinished = true;
      clearInterval(captureInterval);
      finalizeRegistration();
    }

  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    isCapturing = false;
  }
}

// ==============================
// FINALIZE
// ==============================
async function finalizeRegistration() {
  const user = sessionStorage.getItem("username");

  const res = await fetch("/api/enroll/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: user,
      embeddings: embeddings
    })
  });

  const data = await res.json();

  document.getElementById("successText").innerText =
    data.status === "exists"
      ? `Face already registered as ${data.user}`
      : "Face registered successfully";

  document.getElementById("successPopup").classList.remove("hidden");
}

// ==============================
// UI HELPERS
// ==============================
function flashRing() {
  const ring = document.getElementById("scanRing");
  ring.classList.add("green");
  setTimeout(() => ring.classList.remove("green"), 300);
}

function goHome() {
  window.location.href = "/";
}

// ==============================
// AUTO START
// ==============================
video.addEventListener("playing", autoRegister);
