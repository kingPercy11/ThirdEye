import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
import nltk
import string
import pickle
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import emoji
import re
import nltk
from nltk import PorterStemmer
from nltk.corpus import stopwords

# Download required NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)
stop_words = set(stopwords.words('english'))
# Read dataset
try:
    df = pd.read_csv("./dataset/website_classification.csv", encoding='latin1', on_bad_lines='skip', header=0)
except TypeError:
    df = pd.read_csv("./dataset/website_classification.csv", encoding='latin1', error_bad_lines=False, warn_bad_lines=True, header=0)

# df.info()
# df.isna().sum()
# df.shape
# df["Category"].value_counts()

port_stemmer = PorterStemmer()
def preprocessing(text):
    text = text.lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z]", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r'[^\w\s,.!?]', '', text)  # removes most emojis & symbols
    text = text.split()
    text = [port_stemmer.stem(word) for word in text if not word in stop_words]
    return text

df["preprocessed_text"] = df["cleaned_website_text"].apply(preprocessing)

from sklearn.feature_extraction.text import TfidfVectorizer

df["preprocessed_text"] = df["preprocessed_text"].apply(lambda text: " ".join(text))
vectorizer = TfidfVectorizer(max_features=5000)
X_tfidf = vectorizer.fit_transform(df["preprocessed_text"])
X = X_tfidf
Y = df["Category"].values

from sklearn.model_selection import train_test_split
x_train,x_test,y_train,y_test = train_test_split(X,Y,test_size = 0.2 , stratify = Y,random_state=43)
# lr = LogisticRegression()
# lr.fit(x_train,y_train)
# y_pred = lr.predict(x_test)
# print(classification_report(y_pred,y_test , zero_division=True))
# from sklearn.ensemble import RandomForestClassifier
# rfc = RandomForestClassifier()
# rfc.fit(x_train,y_train)
# y_pred = rfc.predict(x_test)
# print(classification_report(y_pred,y_test,zero_division=True))
from sklearn.svm import LinearSVC
svc = LinearSVC()
svc.fit(x_train,y_train)
y_pred = svc.predict(x_test)
print(classification_report(y_pred,y_test,zero_division=True))
pickle.dump(vectorizer, open('vectorizer.pkl', 'wb'))
pickle.dump(svc, open('model.pkl', 'wb'))
pickle.dump(LabelEncoder().fit(Y), open('encoder.pkl', 'wb'))       



# print(f"Loaded {len(df)} rows from CSV")
# print("Columns:", df.columns.tolist())

# # Drop index column if exists
# if 'Unnamed: 0' in df.columns:
#     df = df.drop(columns=['Unnamed: 0'])

# # Use cleaned_website_text and Category columns
# X = df['cleaned_website_text'].fillna('')
# y = df['Category']

# # Remove rows with missing category
# mask = y.notna() & (X.str.strip() != '')
# X = X[mask]
# y = y[mask]

# print(f"After cleaning: {len(X)} rows")

# # Encode labels
# encoder = LabelEncoder()
# y_encoded = encoder.fit_transform(y)

# print("Unique categories:", len(encoder.classes_))
# print("Sample categories:", encoder.classes_[:10])

# # Text preprocessing
# def transform_text(text):
#     text = str(text).lower()
#     text = nltk.word_tokenize(text)
    
#     y = []
#     for i in text:
#         if i.isalnum():
#             y.append(i)
    
#     text = y[:]
#     y.clear()
    
#     for i in text:
#         if i not in stopwords.words('english') and i not in string.punctuation:
#             y.append(i)
            
#     text = y[:]
#     y.clear()
    
#     for i in text:
#         y.append(ps.stem(i))
    
#     return " ".join(y)

# # Apply transformation
# X_transformed = X.apply(transform_text)
# print("Text preprocessing complete")

# # Model building
# X_vectorized = tfidf.fit_transform(X_transformed)
# print("Feature matrix shape:", X_vectorized.shape)

# X_train, X_test, y_train, y_test = train_test_split(
#     X_vectorized, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
# )

# mnb.fit(X_train, y_train)
# y_pred = mnb.predict(X_test)

# print("\n" + "="*50)
# print("Model Performance:")
# print("="*50)
# print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
# print("\nClassification Report:")
# print(classification_report(y_test, y_pred, target_names=encoder.classes_))

# # Save model and encoder
# pickle.dump(tfidf, open('vectorizer.pkl', 'wb'))
# pickle.dump(mnb, open('model.pkl', 'wb'))
# pickle.dump(encoder, open('encoder.pkl', 'wb'))
# print("\n Model saved successfully!")
# print(f"Model can classify {len(encoder.classes_)} categories")
# print(f"Training samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")