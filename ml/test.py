# import streamlit as st
# from streamlit.components.v1 import html
import pickle
import re
import nltk
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords


# Download required NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

# Load the trained model and vectorizer
print("Loading model...")
tfidf = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
print("✓ Model loaded successfully!\n")

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

def predict_category(text):
    """
    Predict the category of a website based on its text content
    
    Args:
        text (str): Website text content (title + description)
    
    Returns:
        tuple: (category_name, confidence_score)
    """
    # Preprocess text
    preprocessed_text = preprocessing(text)
    
    # Vectorize
    vectorized_text = tfidf.transform([preprocessed_text])
    
    # Predict
    category_name = model.predict(vectorized_text)[0]
    
    # Get decision function scores for confidence (LinearSVC doesn't have predict_proba)
    decision_scores = model.decision_function(vectorized_text)[0]
    
    # Calculate confidence as percentage (normalize decision scores)
    if len(decision_scores.shape) > 0 and len(decision_scores) > 1:
        # Multi-class: use max decision score
        max_score = max(decision_scores)
        min_score = min(decision_scores)
        if max_score != min_score:
            confidence = ((max_score - min_score) / (max_score - min_score + 1)) * 100
        else:
            confidence = 95.0
    else:
        # Binary or single score
        confidence = min(abs(decision_scores) * 10, 99.9)
    
    return category_name, confidence

# Test with example website texts
if __name__ == "__main__":
    print("=" * 60)
    print("Website Category Prediction Test")
    print("=" * 60)
    
    # Test cases with various website content
    test_cases = [
        {
            "text": "online shopping books electronics clothes shoes",
            "expected": "Shopping"
        },
        {
            "text": "breaking news politics world sports entertainment",
            "expected": "News"
        },
        {
            "text": "university college education courses online learning",
            "expected": "Education"
        },
        {
            "text": "health fitness nutrition diet exercise wellness",
            "expected": "Health"
        },
        {
            "text": "football soccer basketball sports news scores",
            "expected": "Sports"
        },
        {
            "text": "travel hotels flights vacation booking tourism",
            "expected": "Travel"
        }
    ]
    
    print("\nPredefined Test Cases:")
    print("-" * 60)
    for idx, test in enumerate(test_cases, 1):
        category, confidence = predict_category(test["text"])
        print(f"\nTest {idx}:")
        print(f"  Input: {test['text']}")
        print(f"  Expected: {test.get('expected', 'Unknown')}")
        print(f"  Predicted: {category}")
        print(f"  Confidence: {confidence:.2f}%")
    
    print("\n" + "=" * 60)
    print("Interactive Mode - Enter your own website text")
    print("=" * 60)
    print("Tip: Combine title and description for better results")
    print("Example: 'amazon online shopping books electronics'")
    
    # Interactive testing
    while True:
        print("\nEnter website text (or 'quit' to exit):")
        text = input("Text: ").strip()
        
        if text.lower() == 'quit':
            break
            
        if text:
            category, confidence = predict_category(text)
            print(f"\n✓ Predicted Category: {category}")
            print(f"✓ Confidence: {confidence:.2f}%")
        else:
            print("Please enter some text!")
    
    print("\nThank you for testing!")

