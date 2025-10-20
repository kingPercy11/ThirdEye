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
x_train,x_test,y_train,y_test = train_test_split(X,Y,test_size = 0.3 , stratify = Y,random_state=43)
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

