import os
import json
import joblib
import email as eml_parser
from email import policy
import datetime
import re
import bcrypt
import jwt
import base64
from email.utils import parsedate_to_datetime
from dotenv import load_dotenv
from email.utils import parseaddr
load_dotenv()

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from typing import Optional

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
    Request,

)

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from fastapi.responses import RedirectResponse
from database import engine, Base, get_db
import models

from ml.risk_engine import compute_risk_score
from ml.explainability import (
    extract_explainability_signals,
    get_highlighted_phrases,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "mailguardai-jwt-secret-change-me"
)

JWT_ALGORITHM = "HS256"

IST = datetime.timezone(
    datetime.timedelta(hours=5, minutes=30)
)


# ============================================================
# GMAIL OAUTH CONFIGURATION
# ============================================================


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "https://email-spam-detection-oyhu.onrender.com/gmail/callback"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)

GOOGLE_CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": [GOOGLE_REDIRECT_URI],
    }
}
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly"
]

_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url":
            "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": [
            GOOGLE_REDIRECT_URI
        ],
    }
}

# ============================================================
# GMAIL TOKEN STORAGE
# ============================================================

gmail_tokens = {}
gmail_oauth_verifiers = {}

# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="MailGuard AI",
    description="AI-powered Email Spam Detection and Threat Classification API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ML MODEL PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "saved_models",
    "best_model.pkl"
)

VECTORIZER_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "saved_models",
    "vectorizer.pkl"
)

METRICS_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "saved_models",
    "metrics.json"
)

ml_model = None
vectorizer = None
metrics_info = {}


# ============================================================
# TIME UTILITIES
# ============================================================

def utc_to_ist(dt):
    """
    Convert database UTC datetime to IST.
    """

    if dt is None:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(
            tzinfo=datetime.timezone.utc
        )

    return dt.astimezone(IST)


# ============================================================
# GENERAL UTILITIES
# ============================================================

def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def is_valid_email(email: str) -> bool:
    pattern = (
        r"^[A-Za-z0-9._%+-]+@"
        r"[A-Za-z0-9.-]+\."
        r"[A-Za-z]{2,}$"
    )

    return bool(
        re.match(pattern, email or "")
    )


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:72]

    return bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    password_hash: str
) -> bool:

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            password_hash.encode("utf-8")
        )

    except Exception:
        return False


# ============================================================
# JWT
# ============================================================

def create_access_token(
    user: models.User,
    remember_me: bool = False
) -> str:

    now = datetime.datetime.utcnow()

    expiration_days = 7 if remember_me else 1

    exp = now + datetime.timedelta(
        days=expiration_days
    )

    payload = {
        "sub": user.email,
        "uid": user.id,
        "role": user.role,
        "iat": now,
        "exp": exp,
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):

    auth_header = request.headers.get(
        "Authorization",
        ""
    )

    if not auth_header.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    token = auth_header.replace(
        "Bearer ",
        "",
        1
    ).strip()

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("uid")

        if not user_id:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        user = (
            db.query(models.User)
            .filter(
                models.User.id == int(user_id)
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="User not found."
            )

        return user

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Session expired. Please login again."
        )

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )


# ============================================================
# LOAD ML ARTIFACTS
# ============================================================

def load_ml_artifacts():

    global ml_model
    global vectorizer
    global metrics_info

    try:

        if (
            os.path.exists(MODEL_PATH)
            and os.path.exists(VECTORIZER_PATH)
        ):

            ml_model = joblib.load(
                MODEL_PATH
            )

            vectorizer = joblib.load(
                VECTORIZER_PATH
            )

            print(
                "ML Model successfully loaded:",
                type(ml_model).__name__
            )

        else:

            print(
                "WARNING: ML model artifacts not found."
            )

        if os.path.exists(METRICS_PATH):

            with open(
                METRICS_PATH,
                "r",
                encoding="utf-8"
            ) as f:

                metrics_info = json.load(f)

    except Exception as e:

        print(
            "Error loading ML artifacts:",
            e
        )


@app.on_event("startup")
def startup_event():

    load_ml_artifacts()


# ============================================================
# SPAM CATEGORIES
# ============================================================

SPAM_CATEGORIES = [
    "Banking Scam",
    "Credential Theft",
    "Malware",
    "Financial Scam",
    "Promotional Scam",
    "Lottery Scam",
    "Urgency-Based Scam",
    "Spoofed Spam",
    "Sexual Harassment Scam",
    "Money Scam",
]


# ============================================================
# SPAM INDICATOR KEYWORDS
# ============================================================

SPAM_PATTERNS = {

    "Banking Scam": [
        "bank account",
        "banking",
        "net banking",
        "credit card",
        "debit card",
        "atm",
        "upi",
        "upi payment",
        "bank verification",
        "bank account suspended",
        "bank account blocked",
        "transaction failed",
        "transaction pending",
        "kyc update",
        "kyc verification",
        "account verification",
    ],

    "Credential Theft": [
        "verify your account",
        "verify account",
        "verify your identity",
        "confirm your identity",
        "login immediately",
        "sign in immediately",
        "password verification",
        "reset password",
        "confirm password",
        "username and password",
        "login credentials",
        "account credentials",
        "click here to verify",
    ],

    "Malware": [
        "download attachment",
        "download file",
        "open attachment",
        "install software",
        "install application",
        "run this file",
        "enable macros",
        "malware",
        "virus",
        "trojan",
        "ransomware",
        "infected file",
        "security patch",
        "executable file",
        ".exe",
        ".scr",
        ".bat",
    ],

    "Financial Scam": [
        "investment opportunity",
        "guaranteed profit",
        "guaranteed returns",
        "double your money",
        "make money fast",
        "easy money",
        "financial opportunity",
        "investment scheme",
        "crypto investment",
        "bitcoin investment",
        "profit guaranteed",
    ],

    "Promotional Scam": [
        "limited time offer",
        "exclusive offer",
        "special offer",
        "claim your offer",
        "free offer",
        "discount",
        "free gift",
        "act now",
        "buy now",
        "offer expires",
    ],

    "Lottery Scam": [
        "you won",
        "you have won",
        "winner",
        "lottery",
        "lottery winner",
        "prize",
        "cash prize",
        "claim your prize",
        "lucky winner",
        "congratulations you won",
    ],

    "Urgency-Based Scam": [
        "urgent",
        "immediately",
        "act immediately",
        "act now",
        "final warning",
        "last warning",
        "account will be closed",
        "account will be suspended",
        "within 24 hours",
        "within 48 hours",
        "respond immediately",
        "emergency",
    ],

    "Spoofed Spam": [
        "official notice",
        "security team",
        "support team",
        "administrator",
        "admin team",
        "account security",
        "security alert",
        "unusual activity",
        "suspicious activity",
        "verify immediately",
    ],

    "Sexual Harassment Scam": [
        "explicit photo",
        "private photo",
        "private video",
        "intimate photo",
        "intimate video",
        "embarrassing photo",
        "embarrassing video",
        "send money or",
        "pay or we will",
        "blackmail",
        "blackmailing",
        "leaked photo",
        "leaked video",
    ],

    "Money Scam": [
        "send money",
        "transfer money",
        "wire transfer",
        "pay immediately",
        "payment required",
        "cash transfer",
        "money transfer",
        "send payment",
        "pay now",
        "refund fee",
        "processing fee",
        "claim fee",
    ],
}


# ============================================================
# CAUTIONS
# ============================================================

CATEGORY_CAUTIONS = {

    "Banking Scam": [
        "Do not share your bank account details.",
        "Do not share OTP, PIN or CVV.",
        "Verify the request directly through your bank's official application or website.",
    ],

    "Credential Theft": [
        "Do not enter your username or password through email links.",
        "Open the service using its official website or application.",
        "Change your password if you already entered credentials.",
    ],

    "Malware": [
        "Do not download or open unexpected attachments.",
        "Do not execute unknown files.",
        "Scan attachments with trusted security software.",
    ],

    "Financial Scam": [
        "Do not send money based only on an email promise.",
        "Do not trust guaranteed-return claims.",
        "Verify the organization independently before making financial decisions.",
    ],

    "Promotional Scam": [
        "Do not click suspicious promotional links.",
        "Verify offers through the company's official website.",
        "Avoid providing personal information to claim an offer.",
    ],

    "Lottery Scam": [
        "Do not pay fees to receive an unexpected prize.",
        "Do not share bank or identity information.",
        "Unexpected lottery winnings are a common scam indicator.",
    ],

    "Urgency-Based Scam": [
        "Do not make decisions under email-imposed pressure.",
        "Verify urgent requests independently.",
        "Contact the organization through an official channel.",
    ],

    "Spoofed Spam": [
        "Check the actual sender address carefully.",
        "Do not trust logos or display names alone.",
        "Verify security alerts directly through the official service.",
    ],

    "Sexual Harassment Scam": [
        "Do not respond to threats or blackmail demands.",
        "Do not send money or private information.",
        "Preserve the email for reporting to a trusted adult or appropriate authority.",
    ],

    "Money Scam": [
        "Do not transfer money based on an unexpected email.",
        "Verify payment requests independently.",
        "Do not share banking or payment credentials.",
    ],
}


HAM_CAUTIONS = [
    "No major spam indicators were detected.",
    "Still verify unexpected requests before clicking links or sharing sensitive information.",
]


# ============================================================
# CATEGORY DETECTION
# ============================================================

def detect_spam_category(
    sender: str,
    subject: str,
    body: str
):
    """Detect scam categories using contextual evidence.

    Important: generic words such as ``banking``, ``security``, ``support``,
    ``administrator`` or ``account`` are NOT sufficient on their own.
    Legitimate Google/IBM/job emails frequently contain those words.
    A category is considered a strong spam signal only when the message
    contains a meaningful combination of related indicators, or a clearly
    malicious/high-risk phrase.
    """
    import re

    sender = sender or ""
    subject = subject or ""
    body = body or ""
    combined = f"{subject} {body}".lower()
    sender_lower = sender.lower()

    # Trusted domains are used only as a false-positive safeguard.  They do
    # NOT make an email automatically safe if it contains explicit scam
    # content.
    trusted_domains = {
        "google.com", "googlemail.com", "accounts.google.com",
        "microsoft.com", "live.com", "outlook.com",
        "ibm.com", "linkedin.com", "indeed.com",
        "naukri.com", "glassdoor.com", "coursera.org",
    }

    sender_domain = ""
    if "@" in sender_lower:
        sender_domain = sender_lower.split("@", 1)[1].strip().split(">", 1)[0]

    trusted_sender = any(
        sender_domain == d or sender_domain.endswith("." + d)
        for d in trusted_domains
    )

    def has_any(terms):
        return [t for t in terms if t in combined]

    # Explicit/high-confidence indicators.  These can independently make a
    # message suspicious because they describe an actual attack/scam action.
    explicit_rules = {
        "Credential Theft": [
            "click here to verify your account",
            "click here to verify your identity",
            "enter your password",
            "enter your username and password",
            "send your password",
            "send your login credentials",
            "provide your password",
            "provide your login credentials",
            "confirm your password by clicking",
            "your account will be closed unless you verify",
        ],
        "Banking Scam": [
            "bank account suspended unless",
            "bank account will be blocked unless",
            "verify your bank account by clicking",
            "confirm your bank details immediately",
            "send your otp",
            "share your otp",
            "share otp",
            "share your upi pin",
            "share your pin",
            "card blocked unless you verify",
        ],
        "Malware": [
            "enable macros",
            "disable antivirus",
            "disable your antivirus",
            "run this executable",
            "install this unknown application",
            "install the attached software",
            "ransomware",
            "trojan",
            "malware detected in your attachment",
        ],
        "Financial Scam": [
            "guaranteed profit",
            "guaranteed returns",
            "double your money",
            "make money fast",
            "send money to receive your investment",
            "pay a fee to release your investment",
        ],
        "Lottery Scam": [
            "you have won the lottery",
            "you won the lottery",
            "claim your prize by paying",
            "pay the processing fee to claim",
            "pay a fee to claim your prize",
        ],
        "Sexual Harassment Scam": [
            "send money or i will leak",
            "pay or we will leak",
            "pay or i will publish",
            "private photos will be leaked",
            "private video will be leaked",
            "blackmail",
            "blackmailing",
        ],
        "Money Scam": [
            "send money immediately",
            "transfer money immediately",
            "pay immediately to receive",
            "pay a processing fee",
            "refund fee required",
            "claim fee required",
        ],
    }

    matched_categories = []
    matched_phrases = []

    # Explicit rules first.
    for category, phrases in explicit_rules.items():
        hits = has_any(phrases)
        if hits:
            matched_categories.append(category)
            matched_phrases.extend(hits)

    # Contextual rules. Each rule needs multiple related indicators, which
    # prevents ordinary job/security/account messages from becoming spam.
    contextual = {
        "Banking Scam": {
            "financial": [
                "bank", "bank account", "credit card", "debit card",
                "atm", "upi", "net banking", "transaction", "kyc"
            ],
            "attack": [
                "verify", "verification", "confirm", "suspended",
                "blocked", "otp", "pin", "password", "click", "link",
                "immediately", "urgent"
            ],
        },
        "Credential Theft": {
            "credential": [
                "password", "login credentials", "username", "otp",
                "sign in", "login", "verify your identity"
            ],
            "action": [
                "click", "link", "enter", "provide", "send", "confirm",
                "immediately", "urgent", "suspended", "blocked"
            ],
        },
        "Malware": {
            "file": [
                "attachment", "download", ".exe", ".scr", ".bat",
                "zip file", "rar file", "document"
            ],
            "execution": [
                "open", "run", "install", "enable macros", "execute",
                "disable antivirus", "download"
            ],
        },
        "Financial Scam": {
            "money": [
                "investment", "profit", "returns", "crypto", "bitcoin",
                "money", "financial opportunity"
            ],
            "scam": [
                "guaranteed", "double", "pay a fee", "send money",
                "limited time", "risk free", "risk-free"
            ],
        },
        "Promotional Scam": {
            "offer": [
                "limited time offer", "exclusive offer", "special offer",
                "free gift", "claim your offer", "offer expires"
            ],
            "pressure": [
                "act now", "buy now", "pay now", "click here", "urgent"
            ],
        },
        "Lottery Scam": {
            "prize": [
                "lottery", "winner", "prize", "cash prize", "you won",
                "you have won", "lucky winner"
            ],
            "claim": [
                "claim", "fee", "processing fee", "send money", "payment"
            ],
        },
        "Urgency-Based Scam": {
            "urgency": [
                "final warning", "last warning", "act immediately",
                "respond immediately", "within 24 hours", "within 48 hours"
            ],
            "consequence": [
                "account will be closed", "account will be suspended",
                "account will be blocked", "lose access", "payment required"
            ],
        },
        "Spoofed Spam": {
            "authority": [
                "official notice", "security alert", "security team",
                "support team", "administrator", "admin team"
            ],
            "deception": [
                "verify immediately", "click here", "unusual activity",
                "suspicious activity", "account will be closed",
                "confirm your identity"
            ],
        },
        "Sexual Harassment Scam": {
            "private": [
                "private photo", "private video", "intimate photo",
                "intimate video", "embarrassing photo", "embarrassing video",
                "leaked photo", "leaked video"
            ],
            "threat": [
                "blackmail", "blackmailing", "pay or", "send money or",
                "unless you pay", "or i will leak"
            ],
        },
        "Money Scam": {
            "payment": [
                "send money", "transfer money", "wire transfer", "pay now",
                "payment required", "cash transfer", "money transfer",
                "send payment", "processing fee", "refund fee", "claim fee"
            ],
            "pressure": [
                "immediately", "urgent", "act now", "within 24 hours",
                "final warning", "unless you pay"
            ],
        },
    }

    for category, rule in contextual.items():
        first_hits = has_any(rule["financial"] if category == "Banking Scam" else
                             rule.get("credential", rule.get("file", rule.get("money", rule.get("offer", rule.get("prize", rule.get("urgency", rule.get("authority", rule.get("private", rule.get("payment", []))))))))))
        second_hits = has_any(rule["attack"] if category == "Banking Scam" else
                              rule.get("action", rule.get("execution", rule.get("scam", rule.get("pressure", rule.get("claim", rule.get("consequence", rule.get("deception", rule.get("threat", [])))))))))

        if first_hits and second_hits:
            if category not in matched_categories:
                matched_categories.append(category)
            matched_phrases.extend(first_hits + second_hits)

    # Generic promotional language by itself is not enough to override the ML
    # model. This is especially important for legitimate newsletters, jobs,
    # courses and product updates.
    if "Promotional Scam" in matched_categories and not any(
        phrase in combined for phrase in [
            "pay now", "send money", "payment required", "claim your offer",
            "click here", "offer expires", "limited time offer"
        ]
    ):
        matched_categories.remove("Promotional Scam")

    # For trusted Google/IBM/job-service senders, generic account/security/job
    # language must not itself become a scam classification. Explicit malware,
    # blackmail, OTP/PIN requests, credential harvesting or payment scams still
    # remain valid signals.
    if trusted_sender:
        protected = {
            "Malware", "Sexual Harassment Scam", "Lottery Scam",
            "Financial Scam", "Money Scam"
        }
        if not any(c in protected for c in matched_categories):
            # Remove weak categories when the sender is a known service domain.
            matched_categories = []
            matched_phrases = []

    priority = [
        "Credential Theft",
        "Banking Scam",
        "Malware",
        "Financial Scam",
        "Money Scam",
        "Lottery Scam",
        "Sexual Harassment Scam",
        "Urgency-Based Scam",
        "Spoofed Spam",
        "Promotional Scam",
    ]

    selected_category = next(
        (category for category in priority if category in matched_categories),
        None
    )

    return {
        "is_spam": bool(matched_categories),
        "category": selected_category,
        "matched_categories": matched_categories,
        "matched_phrases": list(dict.fromkeys(matched_phrases)),
        "trusted_sender": trusted_sender,
    }


# ============================================================
# CAUTION GENERATOR
# ============================================================

def generate_cautions(
    classification: str,
    category: str
):

    if classification == "SPAM":

        cautions = CATEGORY_CAUTIONS.get(
            category,
            [
                "Do not click suspicious links.",
                "Do not share sensitive information.",
                "Verify the sender independently.",
            ]
        )

        return cautions

    return HAM_CAUTIONS


# ============================================================
# MODEL PREDICTION
# ============================================================

def get_ml_probability(
    subject: str,
    body: str
):

    text_combined = (
        (subject or "")
        + " "
        + (body or "")
    ).lower()

    if ml_model and vectorizer:

        try:

            text_vec = vectorizer.transform(
                [text_combined]
            )

            if hasattr(
                ml_model,
                "predict_proba"
            ):

                probs = ml_model.predict_proba(
                    text_vec
                )[0]

                classes = getattr(
                    ml_model,
                    "classes_",
                    [0, 1]
                )

                spam_index = 1

                if len(classes) > 1:

                    try:
                        spam_index = list(
                            classes
                        ).index(1)

                    except ValueError:
                        spam_index = 1

                return float(
                    probs[spam_index]
                )

            prediction = ml_model.predict(
                text_vec
            )[0]

            return (
                0.95
                if int(prediction) == 1
                else 0.05
            )

        except Exception as e:

            print(
                "ML prediction error:",
                e
            )

    # Fallback
    fallback_words = [
        "urgent",
        "verify",
        "winner",
        "prize",
        "password",
        "bank",
        "otp",
        "click here",
        "send money",
        "account suspended",
    ]

    matched = sum(
        1
        for word in fallback_words
        if word in text_combined
    )

    if matched >= 2:
        return 0.90

    if matched == 1:
        return 0.70

    return 0.10


# ============================================================
# FINAL CLASSIFICATION
# ============================================================

def classify_email(
    sender: str,
    subject: str,
    body: str
):
    """Return the final Spam/Ham classification.

    The ML model is the normal decision maker.  Category detection is an
    additional high-confidence safety layer and only overrides the model when
    there is contextual evidence of an actual scam/attack.
    """
    ml_probability = get_ml_probability(subject, body)
    category_result = detect_spam_category(sender, subject, body)

    # High-confidence contextual evidence can override a low ML probability.
    strong_category_signal = category_result["is_spam"]

    if strong_category_signal:
        classification = "SPAM"
        category = category_result["category"] or "General Spam"
    else:
        classification = "SPAM" if ml_probability >= 0.70 else "HAM"
        category = "General Spam" if classification == "SPAM" else "Legitimate"

    return {
        "classification": classification,
        "category": category,
        "ml_probability": ml_probability,
        "matched_phrases": category_result["matched_phrases"],
        "matched_categories": category_result["matched_categories"],
        "trusted_sender": category_result.get("trusted_sender", False),
    }


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class LoginRequest(BaseModel):

    email: str
    password: str
    remember_me: Optional[bool] = False


class RegisterRequest(BaseModel):

    full_name: str
    email: str
    password: str


class EmailAnalyzeRequest(BaseModel):

    sender: str
    subject: str
    body: str


class FeedbackRequest(BaseModel):

    is_correct: bool
    user_correction: Optional[str] = None


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "success": True,
        "application": "MailGuard AI",
        "version": "2.0.0",
        "status": "online",
        "message": "MailGuard AI API is running."
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "ml_model_loaded": ml_model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "timestamp": datetime.datetime.now(
            datetime.timezone.utc
        ).isoformat()
    }


# ============================================================
# AUTH - LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):

    email = normalize_email(
        payload.email
    )

    password = (
        payload.password or ""
    ).strip()

    if not email or not password:

        raise HTTPException(
            status_code=400,
            detail="Email and password are required."
        )

    if not is_valid_email(email):

        raise HTTPException(
            status_code=400,
            detail="Invalid email."
        )

    user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if (
        not user
        or not verify_password(
            password,
            user.password_hash
        )
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    display_name = (
        user.full_name
        or user.name
        or email.split("@")[0]
    )

    token = create_access_token(
        user,
        bool(payload.remember_me)
    )

    return {
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": display_name,
            "full_name": display_name,
            "email": user.email,
            "role": user.role,
        },
    }


# ============================================================
# AUTH - REGISTER
# ============================================================

@app.post("/api/auth/register")
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):

    full_name = (
        payload.full_name or ""
    ).strip()

    email = normalize_email(
        payload.email
    )

    password = (
        payload.password or ""
    ).strip()

    if not full_name:

        raise HTTPException(
            status_code=400,
            detail="Full name is required."
        )

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    if not password:

        raise HTTPException(
            status_code=400,
            detail="Password is required."
        )

    if not is_valid_email(email):

        raise HTTPException(
            status_code=400,
            detail="Invalid email."
        )

    if len(password) < 5:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 5 characters."
        )

    existing = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please login instead."
        )

    try:

        user = models.User(
            name=full_name,
            full_name=full_name,
            email=email,
            password_hash=hash_password(
                password
            ),
            role="MailGuard User",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    except Exception as e:

        db.rollback()

        print(
            "Registration error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Server/database error while creating account."
        )

    return {
        "success": True,
        "message": "Registration successful.",
    }

# ============================================================
# GMAIL AUTHORIZATION URL
# ============================================================

@app.get("/api/gmail/auth-url")
def gmail_auth_url(
    current_user: models.User = Depends(
        get_current_user
    )
):

    if (
        not GOOGLE_CLIENT_ID
        or not GOOGLE_CLIENT_SECRET
    ):

        raise HTTPException(
            status_code=500,
            detail="Google OAuth credentials are not configured."
        )

    state_payload = {
        "uid": current_user.id,
        "exp": (
            datetime.datetime.utcnow()
            + datetime.timedelta(minutes=10)
        ),
    }

    state = jwt.encode(
        state_payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=GMAIL_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )

    # Save the PKCE verifier for the callback
    oauth_verifier = flow.code_verifier

    gmail_oauth_verifiers[int(current_user.id)] = oauth_verifier

    return {
        "success": True,
        "authorization_url": authorization_url,
    }

# ============================================================
# GET SINGLE GMAIL EMAIL
# ============================================================

@app.get("/api/gmail/email/{message_id}")
def get_gmail_email(
    message_id: str,
    current_user: models.User = Depends(get_current_user)
):

    user_id = int(current_user.id)

    if user_id not in gmail_tokens:

        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected."
        )

    try:

        credentials = Credentials.from_authorized_user_info(
            json.loads(
                gmail_tokens[user_id]
            ),
            GMAIL_SCOPES
        )

        if credentials.expired and credentials.refresh_token:

            credentials.refresh(
                Request()
            )

            gmail_tokens[user_id] = (
                credentials.to_json()
            )

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        message = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full"
            )
            .execute()
        )

        payload = message.get(
            "payload",
            {}
        )

        headers = payload.get(
            "headers",
            []
        )

        header_map = {
            header["name"].lower():
            header["value"]
            for header in headers
        }

        body = extract_gmail_body(
            payload
        )

        return {

            "success": True,

            "id":
                message.get(
                    "id"
                ),

            "sender":
                header_map.get(
                    "from",
                    ""
                ),

            "to":
                header_map.get(
                    "to",
                    ""
                ),

            "subject":
                header_map.get(
                    "subject",
                    ""
                ),

            "date":
                header_map.get(
                    "date",
                    ""
                ),

            "body":
                body
        }

    except Exception as e:

        print(
            "Gmail email error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve email: "
                + str(e)
            )
        )
# ============================================================
# GMAIL OAUTH CALLBACK
# ============================================================

@app.get("/gmail/callback")
def gmail_callback(
    code: str,
    state: str
):
    try:

        # Decode state
        payload = jwt.decode(
            state,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("uid")

        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid OAuth state."
            )

        # Create OAuth flow
        flow = Flow.from_client_config(
            GOOGLE_CLIENT_CONFIG,
            scopes=GMAIL_SCOPES,
            state=state
        )

        flow.redirect_uri = GOOGLE_REDIRECT_URI

        # IMPORTANT: restore PKCE verifier
        verifier = gmail_oauth_verifiers.get(
            int(user_id)
        )

        if verifier:
            flow.code_verifier = verifier

        # Exchange authorization code
        flow.fetch_token(code=code)

        credentials = flow.credentials

        # Save Gmail credentials
        gmail_tokens[int(user_id)] = credentials.to_json()

        # Remove used verifier
        gmail_oauth_verifiers.pop(
            int(user_id),
            None
        )

        # Redirect back to React
        return RedirectResponse(
            url=f"{FRONTEND_URL}/?gmail=connected"
        )

    except Exception as e:

        print(
            "Gmail callback error:",
            e
        )

        raise HTTPException(
            status_code=400,
            detail=f"Gmail authorization failed: {str(e)}"
        )

# ============================================================
# GMAIL BODY EXTRACTOR
# ============================================================

def extract_gmail_body(payload):
    """
    Extract readable email body from Gmail API payload.
    Handles plain text and HTML emails.
    """

    if not payload:
        return ""

    # --------------------------------------------------------
    # Direct body
    # --------------------------------------------------------

    body_data = (
        payload.get("body", {})
        .get("data")
    )

    if body_data:
        try:
            return base64.urlsafe_b64decode(
                body_data
            ).decode(
                "utf-8",
                errors="ignore"
            )
        except Exception:
            pass

    # --------------------------------------------------------
    # Multipart email
    # --------------------------------------------------------

    parts = payload.get("parts", [])

    plain_text = ""
    html_text = ""

    for part in parts:

        mime_type = part.get(
            "mimeType",
            ""
        )

        # Recursively handle nested multipart
        if part.get("parts"):

            nested_body = extract_gmail_body(
                part
            )

            if nested_body:
                if not html_text:
                    plain_text = nested_body

        body_data = (
            part.get("body", {})
            .get("data")
        )

        if not body_data:
            continue

        try:

            decoded = base64.urlsafe_b64decode(
                body_data
            ).decode(
                "utf-8",
                errors="ignore"
            )

        except Exception:
            continue

        if mime_type == "text/plain":

            plain_text += decoded

        elif mime_type == "text/html":

            html_text += decoded

    # Prefer plain text
    if plain_text.strip():
        return plain_text.strip()

    if html_text.strip():
        return html_text.strip()

    return ""
# ============================================================
# GMAIL INBOX
# ============================================================

@app.get("/api/gmail/inbox")
def get_gmail_inbox(
    current_user: models.User = Depends(get_current_user)
):

    user_id = int(current_user.id)

    if user_id not in gmail_tokens:

        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected."
        )

    try:

        # ----------------------------------------------------
        # GET GMAIL CREDENTIALS
        # ----------------------------------------------------

        credentials = Credentials.from_authorized_user_info(
            json.loads(
                gmail_tokens[user_id]
            ),
            GMAIL_SCOPES
        )

        # ----------------------------------------------------
        # REFRESH EXPIRED TOKEN
        # ----------------------------------------------------

        if (
            credentials.expired
            and credentials.refresh_token
        ):

            credentials.refresh(
                Request()
            )

            gmail_tokens[user_id] = (
                credentials.to_json()
            )

        # ----------------------------------------------------
        # CREATE GMAIL SERVICE
        # ----------------------------------------------------

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        # ----------------------------------------------------
        # GET INBOX MESSAGE IDs
        # ----------------------------------------------------

        response = (
            service.users()
            .messages()
            .list(
                userId="me",
                labelIds=["INBOX"],
                maxResults=20
            )
            .execute()
        )

        messages = response.get(
            "messages",
            []
        )

        inbox = []

        # ----------------------------------------------------
        # HELPER: DECODE GMAIL BODY
        # ----------------------------------------------------

        def decode_gmail_body(data):

            if not data:
                return ""

            try:

                decoded_bytes = (
                    base64.urlsafe_b64decode(
                        data + "=" * (
                            4 - len(data) % 4
                        ) % 4
                    )
                )

                return decoded_bytes.decode(
                    "utf-8",
                    errors="ignore"
                )

            except Exception as e:

                print(
                    "Gmail body decode error:",
                    e
                )

                return ""

        # ----------------------------------------------------
        # HELPER: EXTRACT BODY
        # ----------------------------------------------------

        def extract_body(payload):

            if not payload:
                return ""

            # -----------------------------------------------
            # SIMPLE EMAIL
            # -----------------------------------------------

            body_data = (
                payload
                .get("body", {})
                .get("data")
            )

            if body_data:

                return decode_gmail_body(
                    body_data
                )

            # -----------------------------------------------
            # MULTIPART EMAIL
            # -----------------------------------------------

            parts = payload.get(
                "parts",
                []
            )

            plain_body = ""
            html_body = ""

            for part in parts:

                mime_type = part.get(
                    "mimeType",
                    ""
                )

                # -------------------------------------------
                # PLAIN TEXT
                # -------------------------------------------

                if mime_type == "text/plain":

                    data = (
                        part
                        .get("body", {})
                        .get("data")
                    )

                    if data:

                        plain_body = (
                            decode_gmail_body(
                                data
                            )
                        )

                        if plain_body.strip():

                            return plain_body

                # -------------------------------------------
                # HTML
                # -------------------------------------------

                elif mime_type == "text/html":

                    data = (
                        part
                        .get("body", {})
                        .get("data")
                    )

                    if data:

                        html_body = (
                            decode_gmail_body(
                                data
                            )
                        )

                # -------------------------------------------
                # NESTED MULTIPART
                # -------------------------------------------

                elif part.get("parts"):

                    nested_body = (
                        extract_body(part)
                    )

                    if nested_body.strip():

                        return nested_body

            # -----------------------------------------------
            # FALLBACK TO HTML
            # -----------------------------------------------

            if html_body.strip():

                return html_body

            return ""

        # ----------------------------------------------------
        # GET EACH EMAIL
        # ----------------------------------------------------

        for message in messages:

            message_id = message["id"]

            # IMPORTANT:
            # full = headers + complete email body

            message_data = (
                service.users()
                .messages()
                .get(
                    userId="me",
                    id=message_id,
                    format="full"
                )
                .execute()
            )

            # ------------------------------------------------
            # HEADERS
            # ------------------------------------------------

            headers = (
                message_data
                .get("payload", {})
                .get("headers", [])
            )

            header_map = {
                header["name"].lower():
                header["value"]
                for header in headers
            }

            # ------------------------------------------------
            # EXTRACT FULL EMAIL BODY
            # ------------------------------------------------

            body = extract_body(
                message_data.get(
                    "payload",
                    {}
                )
            )

            # ------------------------------------------------
            # FALLBACK TO SNIPPET
            # ------------------------------------------------

            if not body.strip():

                body = message_data.get(
                    "snippet",
                    ""
                )

            # ------------------------------------------------
            # ADD EMAIL TO INBOX
            # ------------------------------------------------

            inbox.append({

                "id":
                    message_data.get(
                        "id",
                        message_id
                    ),

                "thread_id":
                    message_data.get(
                        "threadId"
                    ),

                "sender":
                    header_map.get(
                        "from",
                        ""
                    ),

                "to":
                    header_map.get(
                        "to",
                        ""
                    ),

                "subject":
                    header_map.get(
                        "subject",
                        "(No Subject)"
                    ),

                "date":
                    header_map.get(
                        "date",
                        ""
                    ),

                "snippet":
                    message_data.get(
                        "snippet",
                        ""
                    ),

                # IMPORTANT FOR ML ANALYSIS
                "body":
                    body,

                "labels":
                    message_data.get(
                        "labelIds",
                        []
                    )
            })

        # ----------------------------------------------------
        # RETURN INBOX
        # ----------------------------------------------------

        return {

            "success": True,

            "count":
                len(inbox),

            "data":
                inbox
        }

    except Exception as e:

        print(
            "Gmail inbox error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve Gmail inbox: "
                + str(e)
            )
        )
# ============================================================
# GET SINGLE GMAIL EMAIL
# ============================================================

@app.get("/api/gmail/email/{message_id}")
def get_gmail_email(
    message_id: str,
    current_user: models.User = Depends(get_current_user)
):

    user_id = int(current_user.id)

    if user_id not in gmail_tokens:

        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected."
        )

    try:

        # ----------------------------------------------------
        # Gmail credentials
        # ----------------------------------------------------

        credentials = Credentials.from_authorized_user_info(
            json.loads(
                gmail_tokens[user_id]
            ),
            GMAIL_SCOPES
        )

        # Refresh expired token
        if credentials.expired and credentials.refresh_token:

            credentials.refresh(
                Request()
            )

            gmail_tokens[user_id] = (
                credentials.to_json()
            )

        # ----------------------------------------------------
        # Gmail API service
        # ----------------------------------------------------

        service = build(
            "gmail",
            "v1",
            credentials=credentials
        )

        # ----------------------------------------------------
        # Get FULL email
        # ----------------------------------------------------

        message_data = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full"
            )
            .execute()
        )

        # ----------------------------------------------------
        # Headers
        # ----------------------------------------------------

        headers = (
            message_data
            .get("payload", {})
            .get("headers", [])
        )

        header_map = {
            header["name"].lower():
            header["value"]
            for header in headers
        }

        # ----------------------------------------------------
        # Extract body
        # ----------------------------------------------------

        body = extract_gmail_body(
            message_data.get(
                "payload",
                {}
            )
        )

        return {

            "success": True,

            "id":
                message_data.get(
                    "id"
                ),

            "thread_id":
                message_data.get(
                    "threadId"
                ),

            "sender":
                header_map.get(
                    "from",
                    ""
                ),

            "to":
                header_map.get(
                    "to",
                    ""
                ),

            "subject":
                header_map.get(
                    "subject",
                    "(No Subject)"
                ),

            "date":
                header_map.get(
                    "date",
                    ""
                ),

            "body":
                body,

            "snippet":
                message_data.get(
                    "snippet",
                    ""
                ),
        }

    except Exception as e:

        print(
            "Gmail email error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve email: "
                + str(e)
            )
        )
# ============================================================
# ANALYZE EMAIL
# ============================================================

@app.post("/api/emails/analyze")
def analyze_email(
    payload: EmailAnalyzeRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. GET INPUT
    # --------------------------------------------------------

    sender = (payload.sender or "").strip()
    subject = (payload.subject or "").strip()
    body = (payload.body or "").strip()

    # --------------------------------------------------------
    # 2. VALIDATE BODY
    # --------------------------------------------------------

    if not body:
        raise HTTPException(
            status_code=400,
            detail="Please enter an email body before analyzing."
        )

    # --------------------------------------------------------
    # 3. EXTRACT ACTUAL EMAIL ADDRESS
    # Example:
    # John Smith <john@example.com>
    # becomes:
    # john@example.com
    # --------------------------------------------------------

    sender_name, sender_email = parseaddr(sender)

    if sender_email:
        sender = sender_email.strip()

    # --------------------------------------------------------
    # 4. VALIDATE SENDER
    # --------------------------------------------------------

    if not sender or not is_valid_email(sender):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid sender email address."
        )

    # --------------------------------------------------------
    # 5. VALIDATE SUBJECT
    # --------------------------------------------------------

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="Please enter an email subject."
        )

    # ========================================================
    # 6. CLASSIFICATION
    # ========================================================

    classification_result = classify_email(
        sender,
        subject,
        body
    )

    classification = classification_result[
        "classification"
    ]

    category = classification_result[
        "category"
    ]

    ml_probability = classification_result[
        "ml_probability"
    ]

    # ========================================================
    # 7. RISK ENGINE
    # ========================================================

    try:

        risk_res = compute_risk_score(
            ml_probability,
            sender,
            subject,
            body
        )

    except Exception as e:

        print(
            "Risk engine error:",
            e
        )

        risk_res = {
            "risk_score": int(
                ml_probability * 100
            ),

            "risk_level": (
                "HIGH"
                if ml_probability >= 0.70
                else "LOW"
            ),

            "breakdown": {},
        }

    # ========================================================
    # 8. FORCE FINAL CLASSIFICATION
    # ========================================================

    risk_res["classification"] = classification
    risk_res["category"] = category

    if classification == "SPAM":

        risk_res["risk_score"] = max(
            int(
                risk_res.get(
                    "risk_score",
                    0
                )
            ),
            70
        )

        risk_res["risk_level"] = (
            "HIGH"
            if risk_res["risk_score"] >= 80
            else "MEDIUM"
        )

    else:

        risk_res["risk_level"] = (
            "LOW"
            if risk_res.get(
                "risk_score",
                0
            ) < 40
            else "MEDIUM"
        )

    # ========================================================
    # 9. EXPLAINABILITY
    # ========================================================

    try:

        xai = extract_explainability_signals(
            sender,
            subject,
            body,
            risk_res,
            vectorizer,
            ml_model
        )

    except Exception as e:

        print(
            "Explainability error:",
            e
        )

        xai = {
            "reasons": [],
            "top_word_weights": [],
        }

    # ========================================================
    # 10. HIGHLIGHT PHRASES
    # ========================================================

    try:

        highlights = get_highlighted_phrases(
            body
        )

    except Exception as e:

        print(
            "Highlight error:",
            e
        )

        highlights = []

    # Add category-specific matched phrases

    for phrase in classification_result[
        "matched_phrases"
    ]:

        if phrase not in highlights:

            highlights.append(
                phrase
            )

    # ========================================================
    # 11. CAUTIONS
    # ========================================================

    cautions = generate_cautions(
        classification,
        category
    )

    # ========================================================
    # 12. REASONS
    # ========================================================

    reasons = list(
        xai.get(
            "reasons",
            []
        )
    )

    for phrase in classification_result[
        "matched_phrases"
    ]:

        reason = (
            f"Detected suspicious indicator: "
            f"'{phrase}'"
        )

        if reason not in reasons:

            reasons.append(
                reason
            )

    if not reasons:

        if classification == "SPAM":

            reasons.append(
                "The email contains characteristics associated with spam."
            )

        else:

            reasons.append(
                "No major spam indicators were detected."
            )

    # ========================================================
    # 13. EXPLAINABILITY JSON
    # ========================================================

    explain_json = {

        "signals": reasons,

        "highlights": highlights,

        "breakdown": risk_res.get(
            "breakdown",
            {}
        ),

        "top_words": xai.get(
            "top_word_weights",
            []
        ),

        "matched_categories":
            classification_result[
                "matched_categories"
            ],

        "matched_phrases":
            classification_result[
                "matched_phrases"
            ],

        "cautions": cautions,
    }

    # ========================================================
    # 14. SAVE EMAIL TO DATABASE
    # ========================================================

    try:

        new_email = models.Email(
            sender=sender,
            subject=subject,
            body=body,
            source_type="manual_input",
        )

        db.add(new_email)

        db.flush()

        active_version = metrics_info.get(
            "model_version",
            "v2.0.0-mailguard"
        )

        new_pred = models.Prediction(
            email_id=new_email.id,

            classification=classification,

            probability=round(
                ml_probability,
                4
            ),

            risk_score=int(
                risk_res.get(
                    "risk_score",
                    0
                )
            ),

            risk_level=risk_res.get(
                "risk_level",
                "LOW"
            ),

            category=category,

            model_version=active_version,

            explainability=explain_json,
        )

        db.add(new_pred)

        db.commit()

        db.refresh(new_email)

    except Exception as e:

        db.rollback()

        print(
            "Email save error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save analyzed email."
        )

    # ========================================================
    # 15. CREATED TIME
    # ========================================================

    created_at = utc_to_ist(
        new_email.created_at
    )

    # ========================================================
    # 16. RETURN RESPONSE
    # ========================================================

    return {

        "success": True,

        "id": new_email.id,

        "sender": sender,

        "subject": subject,

        "body": body,

        "prediction": classification,

        "probability": round(
            ml_probability,
            4
        ),

        "confidence": round(
            (
                ml_probability
                if classification == "SPAM"
                else 1 - ml_probability
            ) * 100,
            1
        ),

        "risk_score": int(
            risk_res.get(
                "risk_score",
                0
            )
        ),

        "risk_level": risk_res.get(
            "risk_level",
            "LOW"
        ),

        "category": category,

        "model_version": metrics_info.get(
            "model_version",
            "v2.0.0-mailguard"
        ),

        "explainability": explain_json,

        "cautions": cautions,

        "created_at": (
            created_at.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
            if created_at
            else None
        ),
    }
# ============================================================
# EMAIL HISTORY
# ============================================================

@app.get("/api/emails/history")
def get_email_history(
    search: Optional[str] = None,
    classification: Optional[str] = None,
    risk_level: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):

    query = (
        db.query(models.Email)
        .join(models.Prediction)
    )

    if search:

        search_value = (
            f"%{search.strip()}%"
        )

        query = query.filter(
            (models.Email.sender.like(
                search_value
            ))
            |
            (models.Email.subject.like(
                search_value
            ))
            |
            (models.Email.body.like(
                search_value
            ))
        )

    if classification:

        classification = (
            classification.upper()
        )

        if classification != "ALL":

            if classification not in [
                "SPAM",
                "HAM"
            ]:

                raise HTTPException(
                    status_code=400,
                    detail="Classification must be SPAM, HAM or ALL."
                )

            query = query.filter(
                models.Prediction.classification
                == classification
            )

    if risk_level:

        if risk_level.upper() != "ALL":

            query = query.filter(
                models.Prediction.risk_level
                == risk_level.upper()
            )

    if category:

        if category.upper() != "ALL":

            query = query.filter(
                models.Prediction.category
                == category
            )

    total_count = query.count()

    emails = (
        query
        .order_by(
            desc(models.Email.created_at)
        )
        .offset(
            (page - 1) * limit
        )
        .limit(limit)
        .all()
    )

    records = []

    for email_obj in emails:

        prediction = (
            email_obj.prediction
        )

        feedback = (
            db.query(models.Feedback)
            .filter(
                models.Feedback.email_id
                == email_obj.id
            )
            .first()
        )

        created_at = utc_to_ist(
            email_obj.created_at
        )

        classification_value = (
            prediction.classification
            if prediction
            else "UNKNOWN"
        )

        category_value = (
            prediction.category
            if prediction
            else "Unclassified"
        )

        cautions = generate_cautions(
            classification_value,
            category_value
        )

        records.append({

            "id": email_obj.id,

            "sender": email_obj.sender,

            "subject": email_obj.subject,

            "body": email_obj.body,

            "classification":
                classification_value,

            "prediction":
                classification_value,

            "category":
                category_value,

            "risk_score":
                prediction.risk_score
                if prediction
                else 0,

            "risk_level":
                prediction.risk_level
                if prediction
                else "LOW",

            "confidence":
                round(
                    (
                        prediction.probability
                        if prediction
                        else 0
                    ) * 100,
                    1
                ),

            "created_at":
                (
                    created_at.strftime(
                        "%Y-%m-%d %H:%M"
                    )
                    if created_at
                    else None
                ),

            "has_feedback":
                feedback is not None,

            "feedback_correct":
                (
                    feedback.is_correct
                    if feedback
                    else None
                ),

            "cautions":
                cautions,

        })

    return {

        "success": True,

        "total":
            total_count,

        "page":
            page,

        "limit":
            limit,

        "pages":
            (
                (
                    total_count
                    + limit
                    - 1
                ) // limit
            ),

        "data":
            records,
    }
# ============================================================
# EMAIL DETAILS
# ============================================================

@app.get("/api/emails/{email_id}")
def get_email_detail(
    email_id: int,
    db: Session = Depends(get_db)
):

    email_obj = (
        db.query(models.Email)
        .filter(
            models.Email.id == email_id
        )
        .first()
    )

    if not email_obj:
        raise HTTPException(
            status_code=404,
            detail="Email record not found."
        )

    prediction = (
        email_obj.prediction
    )

    feedback = (
        db.query(models.Feedback)
        .filter(
            models.Feedback.email_id
            == email_obj.id
        )
        .first()
    )

    classification = (
        prediction.classification
        if prediction
        else "UNKNOWN"
    )

    category = (
        prediction.category
        if prediction
        else "Unclassified"
    )

    cautions = generate_cautions(
        classification,
        category
    )

    created_at = utc_to_ist(
        email_obj.created_at
    )

    # Safely get optional Gmail fields.
    # This prevents errors if your Email model
    # does not yet contain these columns.
    recipient = getattr(
        email_obj,
        "recipient",
        getattr(
            email_obj,
            "to",
            ""
        )
    )

    return {
        "success": True,

        "id": email_obj.id,

        # Gmail email information
        "sender": email_obj.sender,

        "to": recipient,

        "subject": email_obj.subject,

        "body": email_obj.body,

        "date": (
            created_at.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
            if created_at
            else None
        ),

        "created_at": (
            created_at.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
            if created_at
            else None
        ),

        # ====================================================
        # MAILGUARD AI ANALYSIS
        # ====================================================

        "prediction": classification,

        "classification": classification,

        "category": category,

        "probability": (
            prediction.probability
            if prediction
            else 0.0
        ),

        "confidence": round(
            (
                prediction.probability
                if prediction
                else 0.0
            ) * 100,
            1
        ),

        "risk_score": (
            prediction.risk_score
            if prediction
            else 0
        ),

        "risk_level": (
            prediction.risk_level
            if prediction
            else "LOW"
        ),

        "model_version": (
            prediction.model_version
            if prediction
            else "v2.0.0"
        ),

        # ====================================================
        # EXPLAINABLE AI
        # ====================================================

        "explainability": (
            prediction.explainability
            if prediction
            else {}
        ),

        "cautions": cautions,

        # ====================================================
        # FEEDBACK
        # ====================================================

        "feedback": (
            {
                "submitted": True,

                "is_correct":
                    bool(
                        feedback.is_correct
                    ),

                "user_correction":
                    feedback.user_correction,
            }
            if feedback
            else {
                "submitted": False,
                "is_correct": None,
                "user_correction": None,
            }
        ),
    }


# ============================================================
# ANALYZE EMAIL WITH MAILGUARD AI
# ============================================================

@app.post("/api/emails/{email_id}/analyze")
def analyze_email(
    email_id: int,
    db: Session = Depends(get_db)
):
    """
    Analyze an email using the existing MailGuard AI model.

    The frontend calls this endpoint when the user clicks:

        Analyze with MailGuard AI
    """

    email_obj = (
        db.query(models.Email)
        .filter(
            models.Email.id == email_id
        )
        .first()
    )

    if not email_obj:
        raise HTTPException(
            status_code=404,
            detail="Email record not found."
        )

    try:

        # ----------------------------------------------------
        # If prediction already exists, use it.
        # This means your existing ML prediction is preserved.
        # ----------------------------------------------------

        prediction = (
            email_obj.prediction
        )

        if not prediction:

            # =================================================
            # IMPORTANT
            # =================================================
            #
            # If your project already has a prediction function,
            # call that function here.
            #
            # Example:
            #
            # result = predict_email(
            #     sender=email_obj.sender,
            #     subject=email_obj.subject,
            #     body=email_obj.body
            # )
            #
            # Then create models.Prediction from result.
            #
            # -------------------------------------------------
            # Since your existing project already stores
            # Prediction records, this endpoint expects the
            # existing Gmail/import pipeline to create the
            # prediction.
            # -------------------------------------------------

            raise HTTPException(
                status_code=400,
                detail=(
                    "This email has not been analyzed yet. "
                    "Connect this endpoint to your existing "
                    "MailGuard ML prediction function."
                )
            )

        # ----------------------------------------------------
        # Generate explainable AI information
        # ----------------------------------------------------

        explainability = (
            prediction.explainability
            if prediction.explainability
            else {}
        )

        # ----------------------------------------------------
        # Generate safety cautions
        # ----------------------------------------------------

        cautions = generate_cautions(
            prediction.classification,
            prediction.category
        )

        # ----------------------------------------------------
        # Confidence
        # ----------------------------------------------------

        confidence = round(
            (
                prediction.probability
                if prediction.probability
                else 0.0
            ) * 100,
            1
        )

        return {

            "success": True,

            "message":
                "Email analyzed successfully by MailGuard AI.",

            "id":
                email_obj.id,

            "sender":
                email_obj.sender,

            "subject":
                email_obj.subject,

            "body":
                email_obj.body,

            "classification":
                prediction.classification,

            "prediction":
                prediction.classification,

            "category":
                prediction.category,

            "confidence":
                confidence,

            "probability":
                prediction.probability,

            "risk_score":
                prediction.risk_score,

            "risk_level":
                prediction.risk_level,

            "model_version":
                prediction.model_version,

            "explainability":
                explainability,

            "cautions":
                cautions,
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "MailGuard AI analysis failed: "
                + str(e)
            )
        )


# ============================================================
# FEEDBACK
# ============================================================

@app.post("/api/emails/{email_id}/feedback")
def submit_feedback(
    email_id: int,
    payload: FeedbackRequest,
    db: Session = Depends(get_db)
):

    email_obj = (
        db.query(models.Email)
        .filter(
            models.Email.id == email_id
        )
        .first()
    )

    if not email_obj:

        raise HTTPException(
            status_code=404,
            detail="Email record not found."
        )

    prediction = (
        email_obj.prediction
    )

    if not prediction:

        raise HTTPException(
            status_code=400,
            detail="Prediction metadata unavailable."
        )

    correction = payload.user_correction

    if not payload.is_correct:

        if not correction:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Please provide the corrected "
                    "classification."
                )
            )

        correction = correction.strip()

        valid_corrections = [

            "HAM",
            "SPAM",

            "Phishing",
            "Banking Scam",
            "Credential Theft",
            "Malware",
            "Financial Scam",
            "Promotional Scam",
            "Lottery Scam",
            "Urgency-Based Scam",
            "Spoofed Spam",
            "Sexual Harassment Scam",
            "Money Scam",
            "General Spam",
            "Legitimate",
        ]

        valid_lower = [
            value.lower()
            for value in valid_corrections
        ]

        if correction.lower() not in valid_lower:

            raise HTTPException(
                status_code=400,
                detail="Invalid feedback category."
            )

    else:

        correction = (
            prediction.classification
        )

    existing_feedback = (
        db.query(models.Feedback)
        .filter(
            models.Feedback.email_id
            == email_id
        )
        .first()
    )

    if existing_feedback:

        existing_feedback.is_correct = (
            1
            if payload.is_correct
            else 0
        )

        existing_feedback.user_correction = (
            correction
        )

        db.commit()

        return {
            "status": "success",
            "message":
                "Feedback updated successfully.",
        }

    feedback = models.Feedback(

        email_id=email_id,

        model_prediction=
            prediction.classification,

        model_probability=
            prediction.probability,

        user_correction=
            correction,

        is_correct=
            1
            if payload.is_correct
            else 0,

        model_version=
            prediction.model_version,
    )

    db.add(feedback)

    db.commit()

    return {
        "status": "success",

        "message":
            "Feedback saved successfully for "
            "continuous learning.",
    }


# ============================================================
# DELETE EMAIL
# ============================================================

@app.delete("/api/emails/{email_id}")
def delete_email(
    email_id: int,
    db: Session = Depends(get_db)
):

    email_obj = (
        db.query(models.Email)
        .filter(
            models.Email.id == email_id
        )
        .first()
    )

    if not email_obj:

        raise HTTPException(
            status_code=404,
            detail="Email record not found."
        )

    try:

        db.delete(email_obj)

        db.commit()

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to delete email: {str(e)}"
            )
        )

    return {
        "status": "success",

        "message":
            "Email deleted successfully.",

        "id":
            email_id,
    }


# ============================================================
# DASHBOARD STATS
# ============================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db)
):

    total = (
        db.query(models.Prediction)
        .count()
    )

    spam = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.classification
            == "SPAM"
        )
        .count()
    )

    safe = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.classification
            == "HAM"
        )
        .count()
    )

    high_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "HIGH"
        )
        .count()
    )

    medium_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "MEDIUM"
        )
        .count()
    )

    low_risk = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "LOW"
        )
        .count()
    )

    return {

        "success": True,

        "total_analyzed":
            total,

        "spam_detected":
            spam,

        "safe_emails":
            safe,

        "high_risk_emails":
            high_risk,

        "medium_risk_emails":
            medium_risk,

        "low_risk_emails":
            low_risk,
    }


# ============================================================
# DASHBOARD TRENDS
# ============================================================

@app.get("/api/dashboard/trends")
def get_dashboard_trends(
    days: int = Query(
        7,
        description="7 or 30 days"
    ),
    db: Session = Depends(get_db)
):

    if days not in [7, 30]:

        raise HTTPException(
            status_code=400,
            detail="Days must be 7 or 30."
        )

    now_ist = (
        datetime.datetime
        .now(
            datetime.timezone.utc
        )
        .astimezone(IST)
    )

    start_date_ist = (
        now_ist
        - datetime.timedelta(
            days=days - 1
        )
    )

    start_date_utc = (
        start_date_ist
        .astimezone(
            datetime.timezone.utc
        )
        .replace(
            tzinfo=None
        )
    )

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.created_at
            >= start_date_utc
        )
        .all()
    )

    trend_map = {}

    for i in range(days):

        date_value = (
            start_date_ist
            + datetime.timedelta(
                days=i
            )
        )

        key = date_value.strftime(
            "%Y-%m-%d"
        )

        trend_map[key] = {

            "date":
                date_value.strftime(
                    "%b %d"
                ),

            "total":
                0,

            "spam":
                0,

            "safe":
                0,

            "high_risk":
                0,
        }

    for prediction in predictions:

        if not prediction.created_at:
            continue

        created_ist = utc_to_ist(
            prediction.created_at
        )

        key = created_ist.strftime(
            "%Y-%m-%d"
        )

        if key not in trend_map:
            continue

        trend_map[key]["total"] += 1

        if (
            prediction.classification
            == "SPAM"
        ):

            trend_map[key]["spam"] += 1

        else:

            trend_map[key]["safe"] += 1

        if (
            prediction.risk_level
            == "HIGH"
        ):

            trend_map[key][
                "high_risk"
            ] += 1

    return list(
        trend_map.values()
    )


# ============================================================
# RISK + CATEGORY DISTRIBUTION
# ============================================================

@app.get("/api/dashboard/risk-distribution")
def get_risk_distribution(
    db: Session = Depends(get_db)
):

    total = (
        db.query(models.Prediction)
        .count()
    )

    denominator = (
        total
        if total > 0
        else 1
    )

    low = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "LOW"
        )
        .count()
    )

    medium = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "MEDIUM"
        )
        .count()
    )

    high = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.risk_level
            == "HIGH"
        )
        .count()
    )

    categories = (
        db.query(
            models.Prediction.category,
            func.count(
                models.Prediction.id
            )
        )
        .group_by(
            models.Prediction.category
        )
        .all()
    )

    category_breakdown = []

    for category, count in categories:

        if not category:
            category = "Unclassified"

        category_breakdown.append({

            "name":
                category,

            "count":
                count,

            "percentage":
                round(
                    (
                        count
                        / denominator
                    ) * 100,
                    1
                ),
        })

    return {

        "success": True,

        "risk_levels": [

            {
                "level": "LOW RISK",

                "count": low,

                "percentage":
                    round(
                        (
                            low
                            / denominator
                        ) * 100,
                        1
                    ),
            },

            {
                "level": "MEDIUM RISK",

                "count": medium,

                "percentage":
                    round(
                        (
                            medium
                            / denominator
                        ) * 100,
                        1
                    ),
            },

            {
                "level": "HIGH RISK",

                "count": high,

                "percentage":
                    round(
                        (
                            high
                            / denominator
                        ) * 100,
                        1
                    ),
            },
        ],

        "category_breakdown":
            category_breakdown,
    }


# ============================================================
# RECENT THREATS
# ============================================================

@app.get("/api/dashboard/recent-threats")
def get_recent_threats(
    limit: int = Query(
        5,
        ge=1,
        le=50
    ),
    db: Session = Depends(get_db)
):

    emails = (
        db.query(models.Email)
        .join(models.Prediction)
        .order_by(
            desc(
                models.Email.created_at
            )
        )
        .limit(limit)
        .all()
    )

    records = []

    for email_obj in emails:

        prediction = (
            email_obj.prediction
        )

        created_at = utc_to_ist(
            email_obj.created_at
        )

        records.append({

            "id":
                email_obj.id,

            "sender":
                email_obj.sender,

            "subject":
                email_obj.subject,

            "classification":
                prediction.classification
                if prediction
                else "UNKNOWN",

            "category":
                prediction.category
                if prediction
                else "Unclassified",

            "risk_score":
                prediction.risk_score
                if prediction
                else 0,

            "risk_level":
                prediction.risk_level
                if prediction
                else "LOW",

            "time":
                (
                    created_at.strftime(
                        "%I:%M %p"
                    )
                    if created_at
                    else "Just now"
                ),
        })

    return records


# ============================================================
# AVAILABLE CATEGORIES
# ============================================================

@app.get("/api/categories")
def get_categories():

    return {

        "success": True,

        "categories": [

            "Phishing",

            "Banking Scam",

            "Credential Theft",

            "Malware",

            "Financial Scam",

            "Promotional Scam",

            "Lottery Scam",

            "Urgency-Based Scam",

            "Spoofed Spam",

            "Sexual Harassment Scam",

            "Money Scam",

            "General Spam",

            "Legitimate",
        ],
    }


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@app.get("/api/model/performance")
def get_model_performance(
    db: Session = Depends(get_db)
):

    active_model = (
        db.query(
            models.ModelVersion
        )
        .filter(
            models.ModelVersion.is_active
            == 1
        )
        .first()
    )

    all_versions = (
        db.query(
            models.ModelVersion
        )
        .order_by(
            desc(
                models.ModelVersion.training_date
            )
        )
        .all()
    )

    feedback_count = (
        db.query(models.Feedback)
        .count()
    )

    performance_data = (
        metrics_info.get(
            "models_performance",
            {}
        )
    )

    default_active_model = (
        active_model.model_name
        if active_model
        else "Multinomial Naive Bayes"
    )

    default_version = (
        active_model.version
        if active_model
        else "v2.0.0"
    )

    return {

        "success": True,

        "active_model": {

            "name":
                metrics_info.get(
                    "active_model",
                    default_active_model
                ),

            "version":
                metrics_info.get(
                    "model_version",
                    default_version
                ),

            "training_date":
                (
                    active_model.training_date.strftime(
                        "%Y-%m-%d"
                    )
                    if active_model
                    and active_model.training_date
                    else metrics_info.get(
                        "training_date",
                        None
                    )
                ),

            "dataset_size":
                metrics_info.get(
                    "dataset_size",
                    active_model.dataset_size
                    if active_model
                    else 0
                ),

            "feedback_samples":
                feedback_count,

            "accuracy":
                metrics_info.get(
                    "accuracy",
                    active_model.accuracy
                    if active_model
                    else 0
                ),

            "precision":
                metrics_info.get(
                    "precision",
                    active_model.precision
                    if active_model
                    else 0
                ),

            "recall":
                metrics_info.get(
                    "recall",
                    active_model.recall
                    if active_model
                    else 0
                ),

            "f1_score":
                metrics_info.get(
                    "f1_score",
                    active_model.f1_score
                    if active_model
                    else 0
                ),

            "confusion_matrix":
                metrics_info.get(
                    "confusion_matrix",
                    []
                ),
        },

        "model_comparison":
            performance_data,

        "version_history": [

            {
                "id":
                    version.id,

                "version":
                    version.version,

                "model_name":
                    version.model_name,

                "f1_score":
                    version.f1_score,

                "accuracy":
                    version.accuracy,

                "training_date":
                    (
                        version.training_date.strftime(
                            "%Y-%m-%d"
                        )
                        if version.training_date
                        else None
                    ),

                "is_active":
                    version.is_active == 1,
            }

            for version
            in all_versions
        ],
    }


# ============================================================
# RETRAIN MODEL
# ============================================================

@app.post("/api/model/retrain")
def retrain_model_pipeline(
    db: Session = Depends(get_db)
):

    feedbacks = (
        db.query(models.Feedback)
        .all()
    )

    feedback_count = len(
        feedbacks
    )

    MIN_THRESHOLD = 3

    if feedback_count < MIN_THRESHOLD:

        return {

            "status":
                "notice",

            "message":
                (
                    f"{feedback_count} feedback "
                    f"sample(s) collected. "
                    f"At least {MIN_THRESHOLD} "
                    f"validated samples are required."
                ),

            "feedback_count":
                feedback_count,

            "min_required":
                MIN_THRESHOLD,
        }

    try:

        import pandas as pd

        from ml.train_model import (
            train_and_evaluate,
            DATASET_PATH,
        )

        if os.path.exists(
            DATASET_PATH
        ):

            base_df = pd.read_csv(
                DATASET_PATH
            )

        else:

            base_df = pd.DataFrame()

        feedback_rows = []

        for feedback in feedbacks:

            email_obj = (
                db.query(
                    models.Email
                )
                .filter(
                    models.Email.id
                    == feedback.email_id
                )
                .first()
            )

            if not email_obj:
                continue

            correction = (
                feedback.user_correction
                or "SPAM"
            )

            corrected_label = (
                0
                if correction.lower()
                == "ham"
                else 1
            )

            feedback_rows.append({

                "sender":
                    email_obj.sender,

                "subject":
                    email_obj.subject,

                "body":
                    email_obj.body,

                "category":
                    correction,

                "label":
                    corrected_label,
            })

        if feedback_rows:

            feedback_df = pd.DataFrame(
                feedback_rows
            )

            combined_df = pd.concat(
                [
                    base_df,
                    feedback_df
                ],
                ignore_index=True
            )

        else:

            combined_df = base_df

        new_version = (
            f"v2."
            f"{1 + (feedback_count // 5)}"
            f".0-retrained"
        )

        new_metrics = (
            train_and_evaluate(
                combined_df,
                model_version=new_version
            )
        )

        load_ml_artifacts()

        new_model_version = (
            models.ModelVersion(

                version=new_version,

                model_name=
                    new_metrics.get(
                        "active_model",
                        "Multinomial Naive Bayes"
                    ),

                accuracy=
                    new_metrics.get(
                        "accuracy",
                        0
                    ),

                precision=
                    new_metrics.get(
                        "precision",
                        0
                    ),

                recall=
                    new_metrics.get(
                        "recall",
                        0
                    ),

                f1_score=
                    new_metrics.get(
                        "f1_score",
                        0
                    ),

                dataset_size=
                    new_metrics.get(
                        "dataset_size",
                        len(combined_df)
                    ),

                is_active=1,
            )
        )

        (
            db.query(
                models.ModelVersion
            )
            .update({
                models.ModelVersion.is_active:
                    0
            })
        )

        db.add(
            new_model_version
        )

        db.commit()

        return {

            "status":
                "success",

            "message":
                (
                    "Model successfully retrained "
                    "using the base dataset and "
                    f"{feedback_count} validated "
                    "feedback records."
                ),

            "new_version":
                new_version,

            "metrics":
                new_metrics,
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Retraining pipeline failed: "
                + str(e)
            )
        )


# ============================================================
# GMAIL BODY EXTRACTION
# ============================================================

def extract_gmail_body(payload):

    import base64

    body_data = (
        payload.get(
            "body",
            {}
        )
        .get(
            "data"
        )
    )

    if body_data:

        try:

            return base64.urlsafe_b64decode(
                body_data
            ).decode(
                "utf-8",
                errors="ignore"
            )

        except Exception:
            pass

    parts = payload.get(
        "parts",
        []
    )

    for part in parts:

        mime_type = part.get(
            "mimeType",
            ""
        )

        # -----------------------------------------------
        # TEXT PLAIN
        # -----------------------------------------------

        if mime_type == "text/plain":

            data = (
                part.get(
                    "body",
                    {}
                )
                .get(
                    "data"
                )
            )

            if data:

                try:

                    return (
                        base64.urlsafe_b64decode(
                            data
                        )
                        .decode(
                            "utf-8",
                            errors="ignore"
                        )
                    )

                except Exception:
                    pass

        # -----------------------------------------------
        # TEXT HTML
        # -----------------------------------------------

        if mime_type == "text/html":

            data = (
                part.get(
                    "body",
                    {}
                )
                .get(
                    "data"
                )
            )

            if data:

                try:

                    return (
                        base64.urlsafe_b64decode(
                            data
                        )
                        .decode(
                            "utf-8",
                            errors="ignore"
                        )
                    )

                except Exception:
                    pass

        # -----------------------------------------------
        # NESTED PARTS
        # -----------------------------------------------

        nested_parts = part.get(
            "parts",
            []
        )

        if nested_parts:

            nested_payload = {
                "parts": nested_parts
            }

            result = extract_gmail_body(
                nested_payload
            )

            if result:
                return result

    return ""


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    port = int(
        os.getenv(
            "PORT",
            "8000"
        )
    )

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )