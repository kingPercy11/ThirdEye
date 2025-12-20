import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import activityRoutes from "./routes/activity.routes.js";
import debugRoutes from "./routes/debug.routes.js";

dotenv.config();
const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// use env vars with sensible defaults
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/third_eye";
const PORT = process.env.PORT || 5001;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api", activityRoutes);
app.use("/api", debugRoutes);

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});