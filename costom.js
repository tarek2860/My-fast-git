const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const distanceInfo = document.getElementById('distanceInfo');

let faceLandmarks = null;
let handLandmarks = null;

// Initialize FaceMesh
const faceMesh = new FaceMesh.FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// Initialize Hands
const hands = new Hands.Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResultsHands);

// Camera
const camera = new Camera.Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();

function onResults(results) {
  faceLandmarks = results.multiFaceLandmarks[0] || null;
  drawFrame();
}

function onResultsHands(results) {
  handLandmarks = results.multiHandLandmarks[0] || null;
  drawFrame();
}

function drawFrame() {
  canvasCtx.clearRect(0,0,canvasElement.width, canvasElement.height);
  canvasCtx.save();
  canvasCtx.drawImage(videoElement,0,0,canvasElement.width, canvasElement.height);

  if(faceLandmarks){
    // Draw eyes
    const leftEye = faceLandmarks[33]; // Approx left eye center
    const rightEye = faceLandmarks[263]; // Approx right eye center
    canvasCtx.fillStyle = "red";
    canvasCtx.beginPath();
    canvasCtx.arc(leftEye.x * canvasElement.width, leftEye.y * canvasElement.height, 5, 0, Math.PI*2);
    canvasCtx.fill();
    canvasCtx.beginPath();
    canvasCtx.arc(rightEye.x * canvasElement.width, rightEye.y * canvasElement.height, 5, 0, Math.PI*2);
    canvasCtx.fill();
  }

  if(handLandmarks && faceLandmarks){
    // Draw hand
    const handX = handLandmarks[9].x * canvasElement.width; // middle of palm
    const handY = handLandmarks[9].y * canvasElement.height;
    canvasCtx.fillStyle = "blue";
    canvasCtx.beginPath();
    canvasCtx.arc(handX, handY, 10, 0, Math.PI*2);
    canvasCtx.fill();

    // Calculate distance to face center
    const faceCenterX = (faceLandmarks[168].x + faceLandmarks[1].x)/2 * canvasElement.width;
    const faceCenterY = (faceLandmarks[168].y + faceLandmarks[1].y)/2 * canvasElement.height;
    const distance = Math.hypot(handX - faceCenterX, handY - faceCenterY);
    distanceInfo.innerText = `Distance: ${Math.round(distance)}px`;
  }

  canvasCtx.restore();
}
