from fastapi import APIRouter
from services.activity_service import get_activities
from services.description_service import get_website_description
from services.classification_service import classify_website
from config.gemini import GEMINI_API_KEY
import time

router = APIRouter()

@router.get("/analyze")
def analyze_websites(hours: int = None):
    """Fetch all activities from MongoDB, get descriptions, classify them, and return results
    
    Args:
        hours (int, optional): Filter activities from past X hours. If None, analyze all activities.
    """
    try:
        activities = get_activities(hours)
        results = []
        
        print("=" * 80)
        print("WEBSITE CLASSIFICATION ANALYSIS")
        print("=" * 80)
        if hours:
            print(f"Time Range: Past {hours} hours")
        print(f"Total activities found: {len(activities)}\n")
        
        # Track if we hit rate limit
        rate_limit_hit = False
        
        for idx, activity in enumerate(activities, 1):
            url = activity.get("url", "")
            title = activity.get("title", "")
            start_time = activity.get("startTime", "")
            end_time = activity.get("endTime", "")
            duration = activity.get("duration", 0)
            
            # Get description using Gemini (with fallback handling)
            description = get_website_description(url, title)
            
            # If we're using fallback due to rate limit, note it
            if "Website:" in description or description == title:
                if not rate_limit_hit and GEMINI_API_KEY:
                    print(f"\n⚠️ Using fallback descriptions (Gemini API limit may be reached)")
                    rate_limit_hit = True
            
            # Classify based on title + description
            text_to_classify = f"{title} {description}"
            category, confidence = classify_website(text_to_classify)
            
            result = {
                "_id": str(activity["_id"]),
                "url": url,
                "title": title,
                "startTime": str(start_time),
                "endTime": str(end_time),
                "duration": duration,
                "description": description,
                "category": category,
                "confidence": round(confidence, 2)
            }
            results.append(result)
            
            # Print analysis
            print(f"\n[{idx}] Activity Analysis:")
            print(f"  URL: {url}")
            print(f"  Title: {title}")
            print(f"  Start Time: {start_time}")
            print(f"  End Time: {end_time}")
            print(f"  Duration: {duration} seconds ({duration/60:.2f} minutes)")
            print(f"  Description: {description}")
            print(f"  ✓ Category: {category}")
            print(f"  ✓ Confidence: {confidence:.2f}%")
            print("-" * 80)
            
            # Small delay between requests to avoid hitting rate limits too fast
            if GEMINI_API_KEY and not rate_limit_hit and idx < len(activities):
                time.sleep(0.5)  # 0.5 second delay between API calls
        
        print(f"\nTotal activities analyzed: {len(results)}")
        if rate_limit_hit:
            print("ℹ️  Note: Some descriptions used fallback due to API limits")
        print("=" * 80)
        
        return {
            "total": len(results),
            "hours": hours,
            "results": results
        }
    except Exception as e:
        print(f"Error analyzing activities: {e}")
        return {"error": str(e)}
