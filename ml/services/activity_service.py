from config.database import collection
from bson import ObjectId
from datetime import datetime, timedelta

def get_activities(hours: int = None):
    """Fetch activities from MongoDB with optional time filter"""
    query = {}
    if hours is not None and hours > 0:
        time_limit = datetime.now() - timedelta(hours=hours)
        query = {"startTime": {"$gte": time_limit}}
        print(f"Filtering activities from past {hours} hours (since {time_limit})")
    
    return list(collection.find(query))

def get_activity_by_id(item_id: str):
    """Get a single activity by ID"""
    return collection.find_one({"_id": ObjectId(item_id)})

def count_activities():
    """Count total activities in database"""
    return collection.count_documents({})

def get_sample_activities(limit: int = 3):
    """Get sample activities sorted by start time"""
    return list(collection.find().limit(limit).sort("startTime", -1))
