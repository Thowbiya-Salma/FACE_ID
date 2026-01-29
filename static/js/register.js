let captured = false;

async function registerFace() {
  if (captured) return;
  captured = true;

  const blob = await captureFrame();
  const user = sessionStorage.getItem("username");

  const form = new FormData();
  form.append("file", blob);
  form.append("user", user);

  const res = await fetch("/api/enroll", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (data.status === "success") {
    document.getElementById("scanRing").classList.add("green");
    document.getElementById("status").innerText = "Face registered";

    setTimeout(() => {
      document.getElementById("successText").innerText =
        `${user} has been registered`;
      document.getElementById("successPopup").classList.remove("hidden");
    }, 600);
  } else {
    captured = false;
    document.getElementById("status").innerText = "Try again";
  }
}

function goHome() {
  window.location.href = "/";
}