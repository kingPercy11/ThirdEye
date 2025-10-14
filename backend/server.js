import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();

// CORS middleware with proper origin check and error handling
const allowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests like curl or postman
  return (
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  );
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigin(origin)) {
    console.warn("Blocked CORS request from origin:", origin);
    return res.status(403).json({ error: "Not allowed by CORS" });
  }
  // Set CORS headers for allowed origins
  if (origin && allowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Origin, Accept"
    );
  }

  if (req.method === "OPTIONS") {
    // Preflight request
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Simple request logger for debugging incoming requests (headers + body)
app.use((req, res, next) => {
  try {
    console.log(`--> ${req.method} ${req.originalUrl}`);
    const debugHeaders = {
      origin: req.headers.origin,
      "content-type": req.headers["content-type"],
      referer: req.headers.referer,
      "user-agent": req.headers["user-agent"],
    };
    console.log("    headers:", debugHeaders);
    if (req.method !== "OPTIONS") {
      console.log("    body:", req.body);
    }
  } catch (e) {
    console.warn("Request logger error:", e);
  }
  next();
});

// use env vars with sensible defaults
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/thirdeye";
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const activitySchema = new mongoose.Schema({
  url: String,
  title: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
});

const Activity = mongoose.model("Activity", activitySchema);

// Add debug echo endpoint to reproduce failing requests
app.all("/api/debug", (req, res) => {
  res.json({
    method: req.method,
    origin: req.headers.origin || null,
    headers: {
      "content-type": req.headers["content-type"] || null,
      referer: req.headers.referer || null,
      "user-agent": req.headers["user-agent"] || null,
    },
    body: req.body || null,
  });
});

// Routes
app.post("/api/activity", async (req, res) => {
  try {
    const { url, title, startTime, endTime, duration } = req.body;
    console.log("📥 Incoming activity data:", {
      url,
      title,
      startTime,
      endTime,
      duration,
    });

    if (!url || !startTime || !endTime) {
      console.warn("Missing required fields in /api/activity request");
      return res
        .status(400)
        .json({ error: "Missing required fields: url/startTime/endTime" });
    }

    const activity = new Activity({ url, title, startTime, endTime, duration });
    await activity.save();
    res.status(201).json({ message: "Activity saved successfully" });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/activities", async (req, res) => {
  const activities = await Activity.find().sort({ startTime: -1 });
  res.json(activities);
});

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});