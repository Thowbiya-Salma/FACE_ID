const video = document.getElementById("video");

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => console.error(err));

function captureFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
}
