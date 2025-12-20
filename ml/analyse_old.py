from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
from typing import List
import pickle
import re
import os
from dotenv import load_dotenv
import google.generativeai as genai
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
import nltk
from datetime import datetime, timedelta
import time
from urllib.parse import urlparse

# Download required NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["third_eye"]  # Database name: third_eye
collection = db["activities"]  # Collection name: activities

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model_gemini = genai.GenerativeModel('gemini-2.5-flash')  # Updated to stable flash model

# Load classification model - using the trained vectorizer and model
print("Loading classification model...")
vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
print("✓ Model loaded successfully!\n")

# Preprocessing setup
port_stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

def preprocessing(text):
    """Transform text using the same preprocessing as training"""
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z]", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r'[^\w\s,.!?]', '', text)
    text = text.split()
    text = [port_stemmer.stem(word) for word in text if not word in stop_words]
    return " ".join(text)

def get_website_description(url: str, title: str = "") -> str:
    # Fallback: extract domain and use title if Gemini fails
    try:
        domain = urlparse(url).netloc.replace('www.', '')
    except:
        domain = url
    
    # If no Gemini API key, use fallback immediately
    if not GEMINI_API_KEY:
        return f"{title if title else domain}" if title else f"Website: {domain}"
    
    try:
        prompt = f"Give a 4-5 sentence description using keywords of what this website is doing or telling us based on its URL and title and its contents. URL: {url}, Title: {title if title else 'Unknown'}. Only return the description, nothing else."
        response = model_gemini.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        error_msg = str(e)
        
        # Handle rate limiting - use fallback description
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            print(f"⚠️ Rate limit reached for {url}. Using fallback description.")
            # Use title as description if available, otherwise use domain
            if title and title.strip():
                return title
            else:
                return f"Website: {domain}"
        
        # Other errors - log and use fallback
        print(f"Error getting description for {url}: {e}")
        if title and title.strip():
            return title
        else:
            return f"Website: {domain}"

def classify_website(text: str) -> tuple:
    """Classify website based on text description using trained model"""
    preprocessed_text = preprocessing(text)
    vectorized_text = vectorizer.transform([preprocessed_text])
    category = model.predict(vectorized_text)[0]
    
    # Get confidence from decision function
    decision_scores = model.decision_function(vectorized_text)[0]
    if len(decision_scores.shape) > 0 and len(decision_scores) > 1:
        max_score = max(decision_scores)
        min_score = min(decision_scores)
        if max_score != min_score:
            confidence = ((max_score - min_score) / (max_score - min_score + 1)) * 100
        else:
            confidence = 95.0
    else:
        confidence = min(abs(decision_scores) * 10, 99.9)
    
    return category, confidence

# Helper to convert ObjectId to string
def serialize_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@app.get("/")
def read_root():
    return {"message": "Website Classification API - MongoDB + FastAPI + Gemini"}

# Endpoint to analyze all websites
@app.get("/analyze")
def analyze_websites(hours: int = None):
    """Fetch all activities from MongoDB, get descriptions, classify them, and return results
    
    Args:
        hours (int, optional): Filter activities from past X hours. If None, analyze all activities.
    """
    try:
        # Build query with time filter if hours specified
        query = {}
        if hours is not None and hours > 0:
            time_limit = datetime.now() - timedelta(hours=hours)
            query = {"startTime": {"$gte": time_limit}}
            print(f"Filtering activities from past {hours} hours (since {time_limit})")
        
        activities = list(collection.find(query))
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

@app.get("/data", response_model=List[dict])
def get_all_data():
    """Get all activities from MongoDB and print them"""
    data = list(collection.find())
    
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

@app.get("/data/{item_id}")
def get_item(item_id: str):
    document = collection.find_one({"_id": ObjectId(item_id)})
    if document:
        return serialize_document(document)
    return {"error": "Item not found"}

@app.get("/check_db")
def check_db():
    try:
        # Verify we're connected to the correct database
        db.list_collection_names()
        count = collection.count_documents({})
        
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

@app.get("/check-mongo")
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
            activity_count = collection.count_documents({})
            print(f"Total Activities: {activity_count}")
            
            # Get sample activities
            sample_activities = list(collection.find().limit(3).sort("startTime", -1))
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