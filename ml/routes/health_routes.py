from fastapi import APIRouter
from config.database import db, collection, client, MONGO_URI
from services.activity_service import count_activities, get_sample_activities

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Website Classification API - MongoDB + FastAPI + Gemini"}

@router.get("/check_db")
def check_db():
    try:
        # Verify we're connected to the correct database
        db.list_collection_names()
        count = count_activities()
        
        # Extra verification
        print(f"\n🔍 Database Check:")
        print(f"  URI: {MONGO_URI}")
        print(f"  Database: {db.name}")
        print(f"  Collection: {collection.name}")
        print(f"  Total Documents: {count}\n")
        
        return {
            "status": "Connected to MongoDB",
            "database": db.name,
            "collection": collection.name,
            "total_activities": count,
            "uri": MONGO_URI.split('@')[-1] if '@' in MONGO_URI else MONGO_URI  # Hide credentials
        }
    except Exception as e:
        return {"status": "Connection failed", "error": str(e)}

@router.get("/check-mongo")
def check_mongo_connection():
    """Comprehensive MongoDB connection and data check"""
    try:
        print("\n" + "=" * 80)
        print("🔍 MONGODB CONNECTION CHECK")
        print("=" * 80)
        
        # Check connection
        client.admin.command('ping')
        print("✓ MongoDB server is responding")
        
        # Get database info
        db_name = db.name
        print(f"Database Name: {db_name}")
        
        # List collections
        collections = db.list_collection_names()
        print(f"Collections: {', '.join(collections)}")
        
        # Check activities collection
        if "activities" in collections:
            activity_count = count_activities()
            print(f"Total Activities: {activity_count}")
            
            # Get sample activities
            sample_activities = get_sample_activities(3)
            print("\nSample Activities:")
            for idx, act in enumerate(sample_activities, 1):
                print(f"  [{idx}] {act.get('title', 'Untitled')} - {act.get('url', 'N/A')}")
                print(f"      Duration: {act.get('duration', 0)} seconds")
            
            print("=" * 80 + "\n")
            
            return {
                "status": "Connected",
                "database": db_name,
                "collections": collections,
                "totalActivities": activity_count,
                "sampleActivities": [
                    {
                        "id": str(act["_id"]),
                        "url": act.get("url", ""),
                        "title": act.get("title", ""),
                        "duration": act.get("duration", 0)
                    }
                    for act in sample_activities
                ]
            }
        else:
            print("⚠️ Activities collection not found!")
            print("=" * 80 + "\n")
            return {
                "status": "Connected but activities collection missing",
                "database": db_name,
                "collections": collections,
                "totalActivities": 0
            }
            
    except Exception as e:
        print(f"❌ MongoDB Check Failed: {e}")
        print("=" * 80 + "\n")
        return {
            "status": "Error",
            "error": str(e)
        }
