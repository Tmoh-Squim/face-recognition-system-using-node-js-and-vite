import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const FaceLogin = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraAccess, setCameraAccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("🔄 Loading face detection models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        console.log("✅ Face models loaded successfully.");
        setModelsLoaded(true);

        await faceapi.tf.setBackend("cpu");
        await faceapi.tf.ready();

        requestCameraAccess();
      } catch (err) {
        console.error("❌ Failed to load face models:", err);
        setError("Failed to load face models. Check the /models path.");
      }
    };

    const requestCameraAccess = async () => {
      try {
        console.log("📷 Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("✅ Camera access granted:", stream);
        setCameraAccess(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              console.log("🎥 Video playback started.");
              checkCanvas();
            }).catch(err => {
              console.error("❌ Video playback error:", err);
              setError("Camera stream failed to play.");
            });
          };
        } else {
          console.error("❌ Video element not found.");
          setError("Video element is missing in the DOM.");
        }
      } catch (err) {
        console.error("❌ Permission request failed:", err);
        setError("Please enable camera and canvas access in your browser settings.");
      }
    };

    const checkCanvas = () => {
      if (canvasRef.current) {
        console.log("🖼️ Checking canvas rendering permission...");
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
          console.error("❌ Canvas rendering permission denied!");
          setError("Canvas permission required. Please check browser settings.");
        }
      } else {
        console.error("❌ Canvas element not found.");
        setError("Canvas element is missing in the DOM.");
      }
    };

    if (!modelsLoaded) {
      loadModels();
    }
  }, [modelsLoaded]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Face Authentication</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {cameraAccess ? (
        <div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            width="300"
            height="300"
            style={{ border: "2px solid black", background: "#000" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      ) : (
        <p>⏳ Waiting for camera and canvas access...</p>
      )}
    </div>
  );
};

export default FaceLogin;
