import * as activityService from "../services/activity.service.js";

// Controller for saving activity
export const saveActivity = async (req, res) => {
  try {
    const { url, title, startTime, endTime, duration } = req.body;
    console.log("📥 Incoming activity data:", {
      url,
      title,
      startTime,
      endTime,
      duration,
    });

    const result = await activityService.saveActivity(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error saving activity:", error);
    if (error.message.includes("Missing required fields")) {
      console.warn("Missing required fields in /api/activity request");
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Controller for getting all activities
export const getActivities = async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();

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
};

// Controller for checking MongoDB connection
export const checkMongoConnection = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 MONGODB CONNECTION CHECK");
    console.log("=".repeat(80));

    const result = await activityService.checkMongoConnection();
    
    console.log(`Connection State: ${result.state}`);
    console.log(`Database Name: ${result.database}`);
    console.log(`Collections: ${result.collections.join(", ")}`);
    console.log(`Total Activities: ${result.totalActivities}`);
    
    console.log("\nSample Activities:");
    result.sampleActivities.forEach((act, idx) => {
      console.log(`  [${idx + 1}] ${act.title || "Untitled"} - ${act.url}`);
    });

    console.log("=".repeat(80) + "\n");

    res.json(result);
  } catch (error) {
    console.error("❌ MongoDB Check Failed:", error);
    res.status(500).json({
      status: "Error",
      error: error.message,
    });
  }
};

// Controller for adding test data
export const addTestData = async (req, res) => {
  try {
    console.log("🧪 Adding test data...");
    
    const result = await activityService.addTestData();
    
    console.log(`✓ Added ${result.added} test activities`);
    console.log(`✓ Total activities in database: ${result.total}`);
    
    res.json(result);
  } catch (error) {
    console.error("❌ Error adding test data:", error);
    res.status(500).json({ error: error.message });
  }
};
