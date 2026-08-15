import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="MailGuard User")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    source_type = Column(String(50), default="manual_input")  # manual_input, file_upload
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    prediction = relationship("Prediction", back_populates="email", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="email", uselist=False, cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    classification = Column(String(50), nullable=False)  # HAM, SPAM
    probability = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    category = Column(String(50), nullable=False)  # Phishing, Promotional, Suspicious, Legitimate, Spam
    model_version = Column(String(50), nullable=False)
    explainability = Column(JSON, nullable=True)  # Signal explanations & highlight tokens
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    email = relationship("Email", back_populates="prediction")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    model_prediction = Column(String(50), nullable=False)
    model_probability = Column(Float, nullable=False)
    user_correction = Column(String(50), nullable=False)
    is_correct = Column(Integer, nullable=False)  # 1 for correct, 0 for incorrect
    model_version = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    email = relationship("Email", back_populates="feedback")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, unique=True)
    training_date = Column(DateTime, default=datetime.datetime.utcnow)
    dataset_size = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    is_active = Column(Integer, default=1)
