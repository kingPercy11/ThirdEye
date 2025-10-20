from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import re
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
import nltk

# Download required NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

app = FastAPI()

# Load models
vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
encoder = pickle.load(open('encoder.pkl', 'rb'))

port_stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

class TextInput(BaseModel):
    text: str

def preprocessing(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z]", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r'[^\w\s,.!?]', '', text)
    text = text.split()
    text = [port_stemmer.stem(word) for word in text if not word in stop_words]
    return " ".join(text)

@app.post("/predict")
async def predict(input: TextInput):
    try:
        processed_text = preprocessing(input.text)
        vectorized = vectorizer.transform([processed_text])
        prediction = model.predict(vectorized)
        category = encoder.inverse_transform(prediction)[0]
        return {"category": category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Website Classification API"}
