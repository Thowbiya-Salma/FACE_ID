let scanning = true;
let scanInterval = null;
let failTimer = null;
let finished = false;

async function verifyFace() {
  if (!scanning || finished) return;

  const blob = await captureFrame();
  const form = new FormData();
  form.append("file", blob);

  const res = await fetch("/api/verify", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (data.match === true) {
    onSuccess(data.user);
  }
}

function onSuccess(user) {
  if (finished) return;
  finished = true;

  scanning = false;
  clearInterval(scanInterval);
  clearTimeout(failTimer);

  document.querySelector(".scanner-line").style.display = "none";
  document.getElementById("welcomeText").innerText = `Welcome, ${user}`;
  document.getElementById("successPopup").classList.remove("hidden");
}

function onFailure() {
  if (finished) return;
  finished = true;

  scanning = false;
  clearInterval(scanInterval);

  document.querySelector(".scanner-line").style.display = "none";
  document.getElementById("failPopup").classList.remove("hidden");
}

function retry() {
  window.location.reload();
}

video.addEventListener("playing", () => {
  scanInterval = setInterval(verifyFace, 300);
  failTimer = setTimeout(onFailure, 2500);
});
