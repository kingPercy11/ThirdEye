import Activity from "../models/activity.model.js";

// Service for saving activity
export const saveActivity = async (activityData) => {
  const { url, title, startTime, endTime, duration } = activityData;
  
  if (!url || !startTime || !endTime) {
    throw new Error("Missing required fields: url/startTime/endTime");
  }

  const activity = new Activity({ url, title, startTime, endTime, duration });
  await activity.save();
  return { message: "Activity saved successfully" };
};

// Service for fetching all activities
export const getAllActivities = async () => {
  const activities = await Activity.find().sort({ startTime: -1 });
  return activities;
};

// Service for MongoDB check
export const checkMongoConnection = async () => {
  const mongoose = (await import("mongoose")).default;
  
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  
  if (dbState !== 1) {
    throw new Error("MongoDB is not connected");
  }

  const dbName = mongoose.connection.db.databaseName;
  const collections = await mongoose.connection.db.listCollections().toArray();
  const activityCount = await Activity.countDocuments();
  const sampleActivities = await Activity.find().limit(3).sort({ startTime: -1 });

  return {
    status: "Connected",
    state: states[dbState],
    database: dbName,
    collections: collections.map((c) => c.name),
    totalActivities: activityCount,
    sampleActivities: sampleActivities.map((act) => ({
      id: act._id,
      url: act.url,
      title: act.title,
      duration: act.duration,
    })),
  };
};

// Service for adding test data
export const addTestData = async () => {
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
  
  return { 
    message: "Test data added successfully", 
    added: testActivities.length,
    total: count
  };
};
