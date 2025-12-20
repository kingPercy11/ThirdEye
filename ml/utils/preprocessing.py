import nltk
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
import re

# Download required NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)

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
