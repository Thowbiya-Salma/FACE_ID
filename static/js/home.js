const input = document.getElementById("username");
const registerBtn = document.getElementById("register");
const verifyBtn = document.getElementById("verify");

input.addEventListener("input", () => {
  const valid = input.value.trim().length > 0;
  registerBtn.disabled = !valid;
  verifyBtn.disabled = !valid;
});

registerBtn.onclick = () => {
  sessionStorage.setItem("face_user", input.value.trim());
  window.location.href = "/enroll";
};

verifyBtn.onclick = () => {
  sessionStorage.setItem("face_user", input.value.trim());
  window.location.href = "/verify";
};
