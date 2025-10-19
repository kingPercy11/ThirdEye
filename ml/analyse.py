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
MONGO_URI = os.getenv("MONGO_URI", "")
client = MongoClient(MONGO_URI)
db = client["third_eye"]
collection = db["websites"]

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model_gemini = genai.GenerativeModel('gemini-pro')

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
    """Get a one-line description of a website using Gemini API"""
    if not GEMINI_API_KEY:
        return f"Description not available for {url}"
    
    try:
        prompt = f"Give a one-line description (max 15 words) of what this website is about based on its URL and title. URL: {url}, Title: {title if title else 'Unknown'}. Only return the description, nothing else."
        response = model_gemini.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error getting description for {url}: {e}")
        return f"Website at {url}"

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
def analyze_websites():
    """Fetch all websites from MongoDB, get descriptions, classify them, and return results"""
    try:
        websites = list(collection.find())
        results = []
        
        print("=" * 80)
        print("WEBSITE CLASSIFICATION ANALYSIS")
        print("=" * 80)
        
        for idx, site in enumerate(websites, 1):
            url = site.get("url", "")
            title = site.get("title", "")
            user_id = site.get("userId", "Unknown")
            
            # Get description using Gemini
            description = get_website_description(url, title)
            
            # Classify based on title + description
            text_to_classify = f"{title} {description}"
            category, confidence = classify_website(text_to_classify)
            
            result = {
                "_id": str(site["_id"]),
                "url": url,
                "title": title,
                "userId": user_id,
                "description": description,
                "category": category,
                "confidence": round(confidence, 2)
            }
            results.append(result)
            
            # Print analysis
            print(f"\n[{idx}] Website Analysis:")
            print(f"  URL: {url}")
            print(f"  Title: {title}")
            print(f"  User ID: {user_id}")
            print(f"  Description: {description}")
            print(f"  ✓ Category: {category}")
            print(f"  ✓ Confidence: {confidence:.2f}%")
            print("-" * 80)
        
        print(f"\nTotal websites analyzed: {len(results)}")
        print("=" * 80)
        
        return {
            "total": len(results),
            "results": results
        }
    except Exception as e:
        print(f"Error analyzing websites: {e}")
        return {"error": str(e)}

@app.get("/data", response_model=List[dict])
def get_all_data():
    data = list(collection.find())
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
        db.list_collection_names()
        count = collection.count_documents({})
        return {
            "status": "Connected to MongoDB",
            "database": "third_eye",
            "collection": "websites",
            "total_websites": count
        }
    except Exception as e:
        return {"status": "Connection failed", "error": str(e)}