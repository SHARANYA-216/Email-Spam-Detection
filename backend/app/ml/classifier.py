"""
MailGuard AI - Classifier Service
Loads the champion SVM model and TF-IDF vectorizer, performs inference,
and assigns precise threat categories.
"""

import os
import joblib
from typing import Dict, Any, Tuple
from backend.app.ml.preprocessor import prepare_text_for_model, analyze_signals

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(CURRENT_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "champion_svm.joblib")
VECTORIZER_PATH = os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib")

_model = None
_vectorizer = None

def get_model_and_vectorizer():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            from backend.app.ml.train import train_and_evaluate_all
            train_and_evaluate_all()
            
        _model = joblib.load(MODEL_PATH)
        _vectorizer = joblib.load(VECTORIZER_PATH)
    return _model, _vectorizer

def determine_threat_category(is_spam: bool, signals: Dict[str, Any], body: str, subject: str) -> Tuple[str, str]:
    """
    Determines primary threat classification and granular category.
    Returns (classification, subcategory).
    """
    if not is_spam:
        return "LEGITIMATE", "Business Communication"
        
    combined = f"{subject} {body}".lower()
    
    # Check Phishing signals
    if (signals.get("credential_harvest_detected") or 
        signals.get("domain_mismatch") or 
        len(signals.get("suspicious_urls", [])) > 0 or 
        any(k in combined for k in ["verify your account", "password", "suspended", "security alert", "direct deposit", "wire transfer", "login"])):
        return "PHISHING", "Credential & Financial Theft"
        
    # Check Suspicious / Lottery / Advance-fee signals
    if (signals.get("prize_detected") or 
        any(k in combined for k in ["lottery", "won", "$", "beneficiary", "inheritance", "million usd", "claims-office"])):
        return "SUSPICIOUS", "Lottery / Advance-Fee Scam"
        
    # Check Promotional signals
    if (signals.get("promo_detected") or 
        any(k in combined for k in ["discount", "deal", "sale", "free trial", "unsubscribe", "newsletter", "% off"])):
        return "PROMOTIONAL", "Marketing / Unsolicited Offer"
        
    return "SPAM", "Generic Unsolicited Spam"

def classify_email(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Performs full classification inference on an email.
    """
    model, vectorizer = get_model_and_vectorizer()
    signals = analyze_signals(sender, subject, body)
    
    processed_text = prepare_text_for_model(subject, body)
    features = vectorizer.transform([processed_text])
    
    # Get class probabilities
    probabilities = model.predict_proba(features)[0]
    ham_prob = float(probabilities[0])
    spam_prob = float(probabilities[1])
    
    is_spam = spam_prob >= 0.50
    
    # If explicit high-risk phishing signals exist (e.g. IP-based URL or domain mismatch with credential harvest),
    # ensure spam probability reflects the multi-vector risk
    if (signals.get("domain_mismatch") and signals.get("credential_harvest_detected")) or len(signals.get("ip_based_urls", [])) > 0:
        is_spam = True
        spam_prob = max(spam_prob, 0.88)
        ham_prob = 1.0 - spam_prob
        
    classification, category = determine_threat_category(is_spam, signals, body, subject)
    
    return {
        "is_spam": is_spam,
        "classification": classification,
        "category": category,
        "spam_probability": round(spam_prob, 4),
        "ham_probability": round(ham_prob, 4),
        "confidence": round(max(spam_prob, ham_prob) * 100, 1),
        "signals": signals
    }
