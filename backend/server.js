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
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/third_eye";
const PORT = process.env.PORT || 5001;

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
  try {
    const activities = await Activity.find().sort({ startTime: -1 });

    // Print fetched data
    console.log("\n" + "=".repeat(80));
    console.log("📊 FETCHED ACTIVITIES FROM DATABASE");
    console.log("=".repeat(80));
    console.log(`Total activities: ${activities.length}\n`);

    activities.forEach((activity, index) => {
      console.log(`[${index + 1}] Activity:`);
      console.log(`  ID: ${activity._id}`);
      console.log(`  URL: ${activity.url}`);
      console.log(`  Title: ${activity.title || "N/A"}`);
      console.log(`  Start Time: ${activity.startTime}`);
      console.log(`  End Time: ${activity.endTime}`);
      console.log(
        `  Duration: ${activity.duration} seconds (${(
          activity.duration / 60
        ).toFixed(2)} minutes)`
      );
      console.log("-".repeat(80));
    });

    console.log(`\n✓ Total activities fetched: ${activities.length}`);
    console.log("=".repeat(80) + "\n");

    res.json(activities);
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add comprehensive MongoDB check endpoint
app.get("/api/check-mongo", async (req, res) => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 MONGODB CONNECTION CHECK");
    console.log("=".repeat(80));

    // Check connection
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    console.log(`Connection State: ${states[dbState]}`);

    if (dbState !== 1) {
      throw new Error("MongoDB is not connected");
    }

    // Get database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Database Name: ${dbName}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map((c) => c.name).join(", ")}`);

    // Count activities
    const activityCount = await Activity.countDocuments();
    console.log(`Total Activities: ${activityCount}`);

    // Get sample activities
    const sampleActivities = await Activity.find().limit(3).sort({ startTime: -1 });
    console.log("\nSample Activities:");
    sampleActivities.forEach((act, idx) => {
      console.log(`  [${idx + 1}] ${act.title || "Untitled"} - ${act.url}`);
    });

    console.log("=".repeat(80) + "\n");

    res.json({
      status: "Connected",
      database: dbName,
      collections: collections.map((c) => c.name),
      totalActivities: activityCount,
      sampleActivities: sampleActivities.map((act) => ({
        id: act._id,
        url: act.url,
        title: act.title,
        duration: act.duration,
      })),
    });
  } catch (error) {
    console.error("❌ MongoDB Check Failed:", error);
    res.status(500).json({
      status: "Error",
      error: error.message,
    });
  }
});

// Add test data endpoint for development
app.post("/api/test-data", async (req, res) => {
  try {
    console.log("🧪 Adding test data...");
    
    const testActivities = [
      {
        url: "https://github.com",
        title: "GitHub - Where the world builds software",
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 2700000),
        duration: 900
      },
      {
        url: "https://stackoverflow.com",
        title: "Stack Overflow - Where Developers Learn",
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 6300000),
        duration: 900
      },
      {
        url: "https://youtube.com",
        title: "YouTube",
        startTime: new Date(Date.now() - 10800000),
        endTime: new Date(Date.now() - 9000000),
        duration: 1800
      },
      {
        url: "https://amazon.com",
        title: "Amazon - Online Shopping",
        startTime: new Date(Date.now() - 14400000),
        endTime: new Date(Date.now() - 13500000),
        duration: 900
      },
      {
        url: "https://wikipedia.org",
        title: "Wikipedia - Free Encyclopedia",
        startTime: new Date(Date.now() - 18000000),
        endTime: new Date(Date.now() - 16200000),
        duration: 1800
      }
    ];
    
    await Activity.insertMany(testActivities);
    const count = await Activity.countDocuments();
    
    console.log(`✓ Added ${testActivities.length} test activities`);
    console.log(`✓ Total activities in database: ${count}`);
    
    res.json({ 
      message: "Test data added successfully", 
      added: testActivities.length,
      total: count
    });
  } catch (error) {
    console.error("❌ Error adding test data:", error);
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});