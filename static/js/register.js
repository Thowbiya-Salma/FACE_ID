// ==============================
// CONFIG
// ==============================
const MAX_SAMPLES = 5;        // how many face embeddings to save
const CAPTURE_INTERVAL = 800; // ms between captures
const MAX_DURATION = 6000;    // total scan time (ms)

// ==============================
// STATE
// ==============================
let samplesCaptured = 0;
let captureInterval = null;
let stopTimer = null;

// ==============================
// AUTO FACE REGISTRATION
// ==============================
async function autoRegister() {
  const user = sessionStorage.getItem("username");

  if (!user) {
    document.getElementById("status").innerText = "Username missing";
    return;
  }

  // reset state
  samplesCaptured = 0;
  clearInterval(captureInterval);
  clearTimeout(stopTimer);

  document.getElementById("status").innerText =
    "Scanning… slowly turn your head left / right";

  // start capture loop
  captureInterval = setInterval(captureOnce, CAPTURE_INTERVAL);

  // hard stop after fixed duration
  stopTimer = setTimeout(stopCapture, MAX_DURATION);
}

// ==============================
// SINGLE CAPTURE ATTEMPT
// ==============================
async function captureOnce() {
  if (samplesCaptured >= MAX_SAMPLES) {
    stopCapture();
    return;
  }

  const blob = await captureFrame();
  if (!blob) return;

  const user = sessionStorage.getItem("username");

  const form = new FormData();
  form.append("file", blob);
  form.append("user", user);

  try {
    const res = await fetch("/api/enroll", {
      method: "POST",
      body: form
    });

    const data = await res.json();

    if (data.status === "success") {
      samplesCaptured++;
      flashRing();

      document.getElementById("status").innerText =
        `Captured ${samplesCaptured} / ${MAX_SAMPLES}`;
    }
  } catch (err) {
    console.error("Enroll error:", err);
  }
}

// ==============================
// STOP CAPTURE CLEANLY
// ==============================
function stopCapture() {
  clearInterval(captureInterval);
  clearTimeout(stopTimer);

  if (samplesCaptured > 0) {
    finishRegistration();
  } else {
    document.getElementById("status").innerText =
      "No face detected. Please try again.";
  }
}

// ==============================
// VISUAL FEEDBACK
// ==============================
function flashRing() {
  const ring = document.getElementById("scanRing");
  ring.classList.add("green");
  setTimeout(() => ring.classList.remove("green"), 300);
}

// ==============================
// FINISH REGISTRATION
// ==============================
function finishRegistration() {
  document.getElementById("status").innerText =
    "Face registration complete";

  setTimeout(() => {
    document.getElementById("successText").innerText =
      "Face registered successfully";
    document.getElementById("successPopup").classList.remove("hidden");
  }, 600);
}

// ==============================
// NAVIGATION
// ==============================
function goHome() {
  window.location.href = "/";
}
