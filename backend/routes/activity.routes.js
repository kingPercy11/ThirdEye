import express from "express";
import * as activityController from "../controllers/activity.controller.js";

const router = express.Router();

// POST /api/activity - Save activity
router.post("/activity", activityController.saveActivity);

// GET /api/activities - Get all activities
router.get("/activities", activityController.getActivities);

// GET /api/check-mongo - Check MongoDB connection
router.get("/check-mongo", activityController.checkMongoConnection);

// POST /api/test-data - Add test data
router.post("/test-data", activityController.addTestData);

export default router;
