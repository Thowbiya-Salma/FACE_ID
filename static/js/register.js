const REQUIRED_POSES = ["center", "left", "right", "up"];
const CAPTURE_INTERVAL = 1200;

let embeddings = [];
let poseIndex = 0;
let captureInterval = null;

async function autoRegister() {
  embeddings = [];
  poseIndex = 0;

  const user = sessionStorage.getItem("username");
  if (!user) {
    alert("Username missing. Please go back and enter your name.");
    return;
  }

  document.getElementById("status").innerText =
    `Look ${REQUIRED_POSES[poseIndex]}`;

  captureInterval = setInterval(captureOnce, CAPTURE_INTERVAL);
}

async function captureOnce() {
  if (poseIndex >= REQUIRED_POSES.length) return;

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

  const expectedPose = REQUIRED_POSES[poseIndex];
  if (data.pose !== expectedPose) {
    document.getElementById("status").innerText =
      `Please look ${expectedPose}`;
    return;
  }

  embeddings.push(data.embedding);
  poseIndex++;

  flashRing();

  if (poseIndex === REQUIRED_POSES.length) {
    clearInterval(captureInterval);
    finalizeRegistration();
  } else {
    document.getElementById("status").innerText =
      `Look ${REQUIRED_POSES[poseIndex]}`;
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

/* 🔥 AUTO START WHEN CAMERA IS READY */
video.addEventListener("playing", () => {
  autoRegister();
});
