let scanning = true;
let scanInterval = null;
let failTimer = null;

async function verifyFace() {
  if (!scanning) return;

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
  scanning = false;
  clearInterval(scanInterval);
  clearTimeout(failTimer);

  document.querySelector(".scanner-line").style.display = "none";
  document.getElementById("welcomeText").innerText = `Welcome, ${user}`;
  document.getElementById("successPopup").classList.remove("hidden");
}

function onFailure() {
  scanning = false;
  clearInterval(scanInterval);
  document.querySelector(".scanner-line").style.display = "none";
  document.getElementById("failPopup").classList.remove("hidden");
}

function retry() {
  window.location.reload();
}

video.addEventListener("playing", () => {
  scanInterval = setInterval(verifyFace, 300); // 🔥 faster

  failTimer = setTimeout(onFailure, 2500); // 🔥 instant fail
});
