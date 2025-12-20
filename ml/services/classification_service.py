from config.ml_models import vectorizer, model
from utils.preprocessing import preprocessing

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
