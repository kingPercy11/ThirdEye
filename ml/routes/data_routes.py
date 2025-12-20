from fastapi import APIRouter
from typing import List
from services.activity_service import get_activities, get_activity_by_id
from utils.serializers import serialize_document

router = APIRouter()

@router.get("/data", response_model=List[dict])
def get_all_data():
    """Get all activities from MongoDB and print them"""
    data = get_activities()
    
    print("\n" + "=" * 80)
    print("📊 FETCHED ACTIVITIES FROM DATABASE")
    print("=" * 80)
    print(f"Total activities: {len(data)}\n")
    
    for idx, doc in enumerate(data, 1):
        print(f"[{idx}] Activity:")
        print(f"  ID: {doc.get('_id')}")
        print(f"  URL: {doc.get('url', 'N/A')}")
        print(f"  Title: {doc.get('title', 'N/A')}")
        print(f"  Start Time: {doc.get('startTime', 'N/A')}")
        print(f"  End Time: {doc.get('endTime', 'N/A')}")
        print(f"  Duration: {doc.get('duration', 0)} seconds")
        print("-" * 80)
    
    return [serialize_document(d) for d in data]

@router.get("/data/{item_id}")
def get_item(item_id: str):
    document = get_activity_by_id(item_id)
    if document:
        return serialize_document(document)
    return {"error": "Item not found"}
