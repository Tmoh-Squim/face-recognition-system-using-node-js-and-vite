import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const FaceLogin = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
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

        // Force TensorFlow to use CPU (fix for Vercel)
        await faceapi.tf.setBackend("cpu");
        await faceapi.tf.ready();

        // Start video after models load
        await startVideo();
      } catch (err) {
        console.error("❌ Model loading error:", err);
        setError("Failed to load face models. Check /models path.");
      }
    };

    const startVideo = async () => {
      try {
        console.log("📷 Requesting camera access...");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("⚠️ Camera not supported.");
        }

        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user", // Use "environment" for rear camera
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("✅ Camera access granted:", stream);
        setCameraAccess(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log("🎥 Video playback started.");
        } else {
          console.error("❌ Video element not found.");
        }
      } catch (err) {
        console.error("❌ Camera access error:", err);
        setError("Camera access denied. Enable permissions in browser settings.");
      }
    };

    loadModels();
  }, []);
  

  const handleFaceCapture = async (endpoint: string) => {
    if (!videoRef.current || !modelsLoaded) {
      alert("Face detection is not ready yet. Please wait.");
      return;
    }

    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: detections.descriptor }),
      })
        .then((res) => res.json())
        .then((data) => alert(data.message))
        .catch((err) => console.error("❌ API error:", err));
    } else {
      alert("⚠️ Face not recognized! Ensure your face is well-lit and clearly visible.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Face Authentication</h2>

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Tab Navigation */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setActiveTab("login")} disabled={activeTab === "login"}>
          Login
        </button>
        <button onClick={() => setActiveTab("register")} disabled={activeTab === "register"}>
          Register
        </button>
      </div>

      {/* Video Preview */}
      {cameraAccess ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="300"
          height="300"
          style={{ border: "2px solid black", background: "#000" }}
        />
      ) : (
        <p>⏳ Waiting for camera access...</p>
      )}

      {/* Active Tab Content */}
      {activeTab === "login" ? (
        <button onClick={() => handleFaceCapture("https://face-recognition-system-skva.onrender.com/api/auth/face-login")} disabled={!modelsLoaded}>
          Login with Face
        </button>
      ) : (
        <button onClick={() => handleFaceCapture("https://face-recognition-system-skva.onrender.com/api/auth/register-face")} disabled={!modelsLoaded}>
          Register Face
        </button>
      )}
    </div>
  );
};

export default FaceLogin;
