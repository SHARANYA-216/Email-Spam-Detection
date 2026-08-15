"""
MailGuard AI - Pydantic Request & Response Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = "MailGuard User"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Email Analysis
class EmailAnalyzeRequest(BaseModel):
    sender: Optional[str] = Field(None, description="Sender email address")
    subject: Optional[str] = Field(None, description="Email subject line")
    body: str = Field(..., min_length=1, description="Email body content")

class ExplanationItem(BaseModel):
    severity: str
    badge_color: str
    title: str
    explanation: str
    evidence: str

class HighlightSpan(BaseModel):
    text: str
    type: str # normal, high_risk, suspicious
    label: str
    explanation: str

class RiskFactorBreakdown(BaseModel):
    factor: str
    points: float
    max: int
    detail: str

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    email_id: Optional[int] = None
    sender: str
    subject: str
    body: str
    is_spam: bool
    classification: str # LEGITIMATE, PHISHING, PROMOTIONAL, SUSPICIOUS, SPAM
    category: str
    risk_score: int # 0-100
    risk_level: str # LOW, MEDIUM, HIGH
    confidence: float # percentage
    spam_probability: float
    ham_probability: float
    model_version: str
    created_at: Optional[str] = None
    signals: Dict[str, Any]
    risk_breakdown: List[RiskFactorBreakdown]
    explanations: List[ExplanationItem]
    highlight_spans: List[HighlightSpan]

# Feedback
class FeedbackCreateRequest(BaseModel):
    is_correct: bool
    user_correction: Optional[str] = None # Ham, Spam, Phishing, Promotional, Suspicious
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    email_id: int
    prediction_id: Optional[int] = None
    is_correct: bool
    user_correction: Optional[str] = None
    status: str
    created_at: str
    message: str

# Dashboard
class DashboardStatsResponse(BaseModel):
    total_emails: int
    spam_detected: int
    phishing_detected: int
    safe_emails: int
    high_risk_emails: int
    avg_risk_score: float
    accuracy_rate: float
    active_threats_blocked: int

class TrendPoint(BaseModel):
    date: str
    total: int
    spam: int
    safe: int
    high_risk: int

class DashboardTrendsResponse(BaseModel):
    timeframe: str # "7d" or "30d"
    points: List[TrendPoint]

class ClassificationDistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: str

class RiskDistributionResponse(BaseModel):
    low_risk_count: int
    low_risk_pct: float
    medium_risk_count: int
    medium_risk_pct: float
    high_risk_count: int
    high_risk_pct: float
    total: int
    categories: List[ClassificationDistributionItem]

class RecentThreatItem(BaseModel):
    id: int
    sender: str
    subject: str
    category: str
    classification: str
    risk_score: int
    risk_level: str
    created_at: str
    confidence: float

class PaginatedThreatsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[RecentThreatItem]

# Model Performance
class ModelComparisonItem(BaseModel):
    name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]

class ModelPerformanceResponse(BaseModel):
    active_model: str
    algorithm: str
    model_version: str
    training_date: str
    total_dataset_size: int
    train_samples: int
    test_samples: int
    feedback_samples_integrated: int
    champion_metrics: ModelComparisonItem
    model_comparisons: List[ModelComparisonItem]
    retraining_status: str
