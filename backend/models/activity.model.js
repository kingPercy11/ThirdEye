import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  url: String,
  title: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
