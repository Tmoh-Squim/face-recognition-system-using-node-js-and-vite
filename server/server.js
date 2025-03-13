const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const faceapi = require("face-api.js");
const tf = require("@tensorflow/tfjs-node");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let registeredUsers = {}; // Store face descriptors with user IDs

app.post("/api/auth/register-face", async (req, res) => {
  const { userId, faceDescriptor } = req.body;
  console.log('dete',faceDescriptor)
  registeredUsers[userId] = faceDescriptor;
  res.json({ message: "Face registered successfully!" });
});

app.post("/api/auth/face-login", async (req, res) => {
  const { faceDescriptor } = req.body;
  
  for (let userId in registeredUsers) {
    const savedDescriptor = registeredUsers[userId];
    const distance = faceapi.euclideanDistance(faceDescriptor, savedDescriptor);

    if (distance < 0.4) {
      return res.json({ message: `Login successful! Welcome, ${userId}` });
    }
  }

  res.status(401).json({ message: "Face not recognized" });
});

app.listen(5000, () => console.log("Server running on port 5000"));
