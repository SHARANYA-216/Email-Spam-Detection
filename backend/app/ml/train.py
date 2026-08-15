"""
MailGuard AI - Model Training & Evaluation Pipeline
Trains Multinomial Naive Bayes, Logistic Regression, and Calibrated Linear SVM
on the curated 5,949 email dataset. Evaluates metrics, computes confusion matrices,
and saves the champion SVM model.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from backend.app.ml.preprocessor import prepare_text_for_model

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(CURRENT_DIR, "..", "data", "emails_5949.csv")
MODELS_DIR = os.path.join(CURRENT_DIR, "models")

def train_and_evaluate_all():
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(DATASET_PATH):
        from backend.app.data.dataset_builder import generate_or_load_dataset
        df = generate_or_load_dataset()
    else:
        df = pd.read_csv(DATASET_PATH)
        
    print(f"Loaded dataset with {len(df)} records.")
    
    # Preprocess text
    df['processed_text'] = df.apply(lambda r: prepare_text_for_model(str(r.get('subject', '')), str(r.get('body', ''))), axis=1)
    
    X = df['processed_text']
    y = df['label'].astype(int)
    
    # 80% Training, 20% Unseen Test - Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")
    
    # TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=12000,
        sublinear_tf=True,
        stop_words='english'
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Save Vectorizer
    vectorizer_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib")
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Saved TF-IDF vectorizer to {vectorizer_path}")
    
    # 1. Multinomial Naive Bayes
    print("\n--- Training Multinomial Naive Bayes ---")
    nb_model = MultinomialNB(alpha=0.1)
    nb_model.fit(X_train_vec, y_train)
    nb_preds = nb_model.predict(X_test_vec)
    
    nb_metrics = {
        "name": "Naive Bayes (Multinomial)",
        "accuracy": round(float(accuracy_score(y_test, nb_preds)), 4),
        "precision": round(float(precision_score(y_test, nb_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, nb_preds, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, nb_preds, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, nb_preds).tolist()
    }
    
    # 2. Logistic Regression
    print("\n--- Training Logistic Regression ---")
    lr_model = LogisticRegression(C=1.5, max_iter=1000, random_state=42)
    lr_model.fit(X_train_vec, y_train)
    lr_preds = lr_model.predict(X_test_vec)
    
    lr_metrics = {
        "name": "Logistic Regression",
        "accuracy": round(float(accuracy_score(y_test, lr_preds)), 4),
        "precision": round(float(precision_score(y_test, lr_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, lr_preds, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, lr_preds, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, lr_preds).tolist()
    }
    
    # 3. Support Vector Machine (LinearSVC with Probability Calibration)
    print("\n--- Training Support Vector Machine (SVM) ---")
    base_svm = LinearSVC(C=1.0, random_state=42, max_iter=3000)
    svm_calibrated = CalibratedClassifierCV(estimator=base_svm, cv=5)
    svm_calibrated.fit(X_train_vec, y_train)
    svm_preds = svm_calibrated.predict(X_test_vec)
    
    svm_metrics = {
        "name": "Support Vector Machine (SVM)",
        "accuracy": round(float(accuracy_score(y_test, svm_preds)), 4),
        "precision": round(float(precision_score(y_test, svm_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, svm_preds, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, svm_preds, zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, svm_preds).tolist()
    }
    
    print("\n=== Model Comparison Results ===")
    print(f"Naive Bayes -> Accuracy: {nb_metrics['accuracy']*100:.2f}%, F1: {nb_metrics['f1_score']:.4f}")
    print(f"Logistic Reg -> Accuracy: {lr_metrics['accuracy']*100:.2f}%, F1: {lr_metrics['f1_score']:.4f}")
    print(f"Linear SVM   -> Accuracy: {svm_metrics['accuracy']*100:.2f}%, F1: {svm_metrics['f1_score']:.4f}")
    
    # Save Champion SVM Model
    champion_path = os.path.join(MODELS_DIR, "champion_svm.joblib")
    joblib.dump(svm_calibrated, champion_path)
    print(f"\nChampion model selected: SVM (Saved to {champion_path})")
    
    # Save LR as secondary baseline
    lr_path = os.path.join(MODELS_DIR, "logistic_regression.joblib")
    joblib.dump(lr_model, lr_path)
    
    nb_path = os.path.join(MODELS_DIR, "naive_bayes.joblib")
    joblib.dump(nb_model, nb_path)
    
    # Save complete evaluation bundle
    evaluation_bundle = {
        "model_version": "v1.2.0-svm-prod",
        "algorithm": "Support Vector Machine (Calibrated LinearSVC)",
        "training_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ"),
        "total_dataset_size": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "champion_metrics": svm_metrics,
        "comparison": [svm_metrics, lr_metrics, nb_metrics],
        "feature_count": len(vectorizer.get_feature_names_out())
    }
    
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_bundle, f, indent=2)
    print(f"Saved evaluation metrics to {metrics_path}")
    
    return evaluation_bundle

if __name__ == "__main__":
    train_and_evaluate_all()
