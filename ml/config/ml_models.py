import pickle

# Load classification model - using the trained vectorizer and model
print("Loading classification model...")
vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
print("✓ Model loaded successfully!\n")
