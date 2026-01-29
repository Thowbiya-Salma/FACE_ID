const MAX_SAMPLES = 4;
const CAPTURE_INTERVAL = 1500;
const MAX_DURATION = 9000;

let embeddings = [];
let captureInterval = null;
let stopTimer = null;

async function autoRegister() {
  embeddings = [];

  document.getElementById("status").innerText =
    "Scanning… slowly turn your head";

  captureInterval = setInterval(captureOnce, CAPTURE_INTERVAL);
  stopTimer = setTimeout(stopCapture, MAX_DURATION);
}

async function captureOnce() {
  if (embeddings.length >= MAX_SAMPLES) {
    stopCapture();
    return;
  }

  const blob = await captureFrame();
  if (!blob) return;

  const form = new FormData();
  form.append("file", blob);

  const res = await fetch("/api/enroll", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (data.status === "ok") {
    embeddings.push(data.embedding);
    flashRing();

    document.getElementById("status").innerText =
      `Captured ${embeddings.length}/${MAX_SAMPLES}`;
  }
}

function stopCapture() {
  clearInterval(captureInterval);
  clearTimeout(stopTimer);

  if (embeddings.length === MAX_SAMPLES) {
    finalizeRegistration();
  } else {
    document.getElementById("status").innerText =
      "Face not captured properly. Try again.";
  }
}

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

  if (data.status === "exists") {
    document.getElementById("successText").innerText =
      `Face already registered as ${data.user}`;
  } else {
    document.getElementById("successText").innerText =
      "Face registered successfully";
  }

  document.getElementById("successPopup").classList.remove("hidden");
}

function flashRing() {
  const ring = document.getElementById("scanRing");
  ring.classList.add("green");
  setTimeout(() => ring.classList.remove("green"), 300);
}

function goHome() {
  window.location.href = "/";
}
