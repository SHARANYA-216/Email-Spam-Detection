"""
MailGuard AI - Database Models
Defines schema for Users, Emails, Predictions, Feedback, and Model Versions.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="Enterprise MailGuard User")
    role = Column(String(50), default="MailGuard User")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    emails = relationship("EmailRecord", back_populates="user")
    feedback = relationship("FeedbackRecord", back_populates="user")

class EmailRecord(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender = Column(String(255), index=True, nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    file_type = Column(String(20), default="text/plain")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="emails")
    prediction = relationship("PredictionRecord", back_populates="email", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("FeedbackRecord", back_populates="email", cascade="all, delete-orphan")

class PredictionRecord(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False, unique=True)
    is_spam = Column(Boolean, nullable=False)
    classification = Column(String(50), nullable=False, index=True) # LEGITIMATE, PHISHING, PROMOTIONAL, SUSPICIOUS, SPAM
    category = Column(String(100), nullable=False)
    risk_score = Column(Integer, nullable=False, index=True) # 0-100
    risk_level = Column(String(20), nullable=False, index=True) # LOW, MEDIUM, HIGH
    confidence = Column(Float, nullable=False)
    spam_probability = Column(Float, nullable=False)
    ham_probability = Column(Float, nullable=False)
    signals_json = Column(Text, nullable=True)
    explanations_json = Column(Text, nullable=True)
    highlight_spans_json = Column(Text, nullable=True)
    model_version = Column(String(50), default="v1.2.0-svm-prod")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    email = relationship("EmailRecord", back_populates="prediction")
    feedback = relationship("FeedbackRecord", back_populates="prediction")

class FeedbackRecord(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_correct = Column(Boolean, nullable=False)
    user_correction = Column(String(50), nullable=True) # Ham, Spam, Phishing, Promotional, Suspicious
    comment = Column(Text, nullable=True)
    status = Column(String(30), default="APPROVED") # PENDING, APPROVED, MERGED
    model_version = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="feedback")
    email = relationship("EmailRecord", back_populates="feedback")
    prediction = relationship("PredictionRecord", back_populates="feedback")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, index=True, nullable=False)
    algorithm = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    training_samples = Column(Integer, nullable=False)
    feedback_samples = Column(Integer, default=0)
    confusion_matrix_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
