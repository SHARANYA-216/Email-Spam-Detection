"""
MailGuard AI - Enterprise AI Email Threat Detection API Server
"""

import os
import json
from datetime import datetime, timedelta
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, EmailRecord, PredictionRecord, FeedbackRecord, ModelVersion
from backend.app.auth import get_password_hash
from backend.app.ml.classifier import get_model_and_vectorizer
from backend.app.routers import auth, emails, dashboard, model

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend")

def seed_initial_data():
    """Seeds default admin user and initial enterprise telemetry for rich dashboard analytics."""
    db = SessionLocal()
    try:
        # Create Tables
        Base.metadata.create_all(bind=engine)
        
        # 1. Seed Default User
        admin_user = db.query(User).filter(User.email == "analyst@mailguard.ai").first()
        if not admin_user:
            admin_user = User(
                email="analyst@mailguard.ai",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Prashanthi Kolli",
                role="Lead SecOps Analyst"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Seeded default analyst user: analyst@mailguard.ai / Admin@123")
            
        # 2. Seed Initial Model Version
        if db.query(ModelVersion).count() == 0:
            v1 = ModelVersion(
                version_tag="v1.2.0-svm-prod",
                algorithm="Support Vector Machine (Calibrated LinearSVC)",
                accuracy=0.9899,
                precision=0.9897,
                recall=0.9897,
                f1_score=0.9897,
                training_samples=4759,
                feedback_samples=18,
                confusion_matrix_json=json.dumps([[597, 13], [11, 569]]),
                is_active=True
            )
            db.add(v1)
            db.commit()

        # 3. Seed Realistic Historical Email & Prediction Telemetry if empty
        if db.query(PredictionRecord).count() < 10:
            print("Seeding realistic enterprise email threat telemetry...")
            
            sample_seeds = [
                # Phishing
                ("security-alert@microsoft-auth-center.com", "URGENT: Office 365 Password Expiration Notice",
                 "Dear Employee,\nYour Microsoft 365 corporate account password will expire in 2 hours. To maintain access to Outlook and Teams, verify your current credentials at http://login-microsoft365-verify.security-auth.net/recover.\nFailure to comply will lock your corporate workstation.\n\nIT Security Helpdesk",
                 "PHISHING", "Credential Theft", 96, "HIGH", True, 0.98, 0.02),
                 
                ("payroll@direct-deposit-portal.net", "Action Required: Update W-2 Tax Withholding & Direct Deposit",
                 "All staff members must verify their banking routing and checking account details in the employee self-service portal: https://workday-payroll-update.com/login?token=9281. Unverified accounts will experience salary disbursement hold.\n\nFinance Operations",
                 "PHISHING", "Financial Fraud", 92, "HIGH", True, 0.94, 0.06),
                 
                ("tracking@fedex-express-delivery-parcel.info", "FedEx Tracking #FX-89410: Delivery Suspended - Address Incomplete",
                 "Your incoming shipment cannot be delivered due to missing apartment unit details. A $2.50 address correction surcharge is required. Update details at http://fedex-parcel-redelivery-portal.info/track?id=99281 within 24 hours.\n\nFedEx Logistics",
                 "PHISHING", "Package Delivery Lure", 88, "HIGH", True, 0.91, 0.09),
                 
                # Suspicious
                ("claims@international-lottery-commission.cc", "CONGRATULATIONS: You Have Won $1,500,000.00 USD in Global Draw",
                 "YOUR EMAIL WAS DRAWN AS 1ST PRIZE WINNER IN THE 2026 INTERNATIONAL LOTTERY PROGRAM. SEND YOUR PASSPORT AND TELEPHONE NUMBER TO CLAIMS-OFFICE@LOTTERY-PAYOUTS.CC TO INITIATE WIRE TRANSFER.\n\nLOTTERY COMMISSION",
                 "SUSPICIOUS", "Lottery / Prize Scam", 95, "HIGH", True, 0.97, 0.03),
                 
                ("barrister.morgan@escrow-vault.net", "Confidential Business Transfer of $24.5M USD Inheritance",
                 "Dear Partner, I represent a deceased client with $24.5M deposited in an overseas financial institution. I propose partnering with you to disburse the funds, offering 35% commission. Reply to barrister.morgan@secure-vault-escrow.net.",
                 "SUSPICIOUS", "Advance-Fee Scam", 89, "HIGH", True, 0.92, 0.08),

                # Promotional
                ("offers@cloudtech-academy-promotions.com", "70% Off: Master Generative AI & Cloud Architecture Bundle",
                 "Unlock lifetime access to 50+ DevOps, AWS, and Python masterclasses for $19.99! Limited flash sale ends at midnight. Claim offer at https://cloudtech-academy-promotions.com/deals. Unsubscribe if you prefer not to receive promotional discount emails.",
                 "PROMOTIONAL", "Commercial Marketing", 54, "MEDIUM", True, 0.65, 0.35),
                 
                ("newsletter@saas-growth-tools.io", "Scale Your Enterprise B2B Sales Pipeline by 300%",
                 "Looking for high-converting sales leads? Our autonomous outreach platform identifies verified buyer contacts. Book your 15-minute demo today at https://salesgrowth-ai.io/demo and get 500 free credits.",
                 "PROMOTIONAL", "Marketing Outreach", 48, "MEDIUM", True, 0.58, 0.42),
                 
                ("deals@superdeal-electronics-shop.com", "Mega Flash Sale: Noise Canceling Headphones & Smart Watches",
                 "Shop our exclusive weekend deals with up to 80% markdowns on electronics. Free shipping on orders over $50. Visit https://superdeal-electronics-shop.com to explore all discounts.",
                 "PROMOTIONAL", "E-Commerce Promo", 52, "MEDIUM", True, 0.62, 0.38),

                # Legitimate / Ham
                ("sarah.jenkins@acmecorp.com", "Sprint Planning & Q3 Product Roadmap Alignment Meeting",
                 "Hi Prashanthi,\nPlease find the agenda for tomorrow's Sprint Planning session at 10:00 AM UTC. We will review user stories for Sprint 42, align on the database indexing strategy, and walk through the updated API specification.\n\nBest,\nSarah Jenkins",
                 "LEGITIMATE", "Business Communication", 8, "LOW", False, 0.03, 0.97),
                 
                ("alex.kumar@acmecorp.com", "Code Review: PR #412 - Implement Caching Layer for Analytics API",
                 "Hi Team,\nI have submitted PR #412 which adds Redis caching to the dashboard endpoints, reducing p99 latency to 45ms. Please take a look when you have a moment: https://github.com/internal-org/analytics-service/pull/412.\n\nThanks,\nAlex",
                 "LEGITIMATE", "Engineering Review", 12, "LOW", False, 0.05, 0.95),
                 
                ("david.vance@acmecorp.com", "Monthly All-Hands Town Hall Notes & Team Highlights",
                 "Dear All,\nThank you for attending today's Town Hall. The presentation deck and meeting recording have been published to our Confluence workspace. Congratulations to the ML SecOps team on their milestone.\n\nRegards,\nPeople Ops",
                 "LEGITIMATE", "Internal Announcement", 6, "LOW", False, 0.02, 0.98),
                 
                ("elena.rostova@acmecorp.com", "Customer Onboarding Sync: Enterprise Healthcare Rollout",
                 "Hi Marcus,\nThe onboarding session with HealthTech went smoothly. We configured SSO authentication and verified webhook integration. Next touchpoint is set for Friday at 2:00 PM.\n\nBest,\nElena",
                 "LEGITIMATE", "Client Coordination", 9, "LOW", False, 0.04, 0.96)
            ]
            
            # Generate 45 realistic distributed records across past 30 days
            now = datetime.utcnow()
            for idx in range(45):
                sample = sample_seeds[idx % len(sample_seeds)]
                offset_days = random.randint(0, 28)
                offset_hours = random.randint(1, 23)
                offset_mins = random.randint(0, 59)
                created_dt = now - timedelta(days=offset_days, hours=offset_hours, minutes=offset_mins)
                
                em = EmailRecord(
                    user_id=admin_user.id,
                    sender=sample[0],
                    subject=f"{sample[1]} (Ref #{1000 + idx})",
                    body=sample[2],
                    file_type="text/plain",
                    created_at=created_dt
                )
                db.add(em)
                db.flush()
                
                signals = {
                    "url_count": 1 if "http" in sample[2] else 0,
                    "urls": ["http://external-link.sample.com"] if "http" in sample[2] else [],
                    "suspicious_urls": ["http://external-link.sample.com"] if sample[7] else [],
                    "ip_based_urls": [] if not sample[7] else (["http://185.220.101.5/auth"] if idx % 4 == 0 else []),
                    "domain_mismatch": sample[7],
                    "sender_domain": sample[0].split("@")[-1],
                    "urgency_detected": "urgent" in sample[1].lower() or "required" in sample[1].lower(),
                    "prize_detected": "congratulations" in sample[1].lower() or "won" in sample[1].lower(),
                    "credential_harvest_detected": "password" in sample[2].lower() or "verify" in sample[2].lower(),
                    "promo_detected": "off" in sample[1].lower() or "sale" in sample[1].lower(),
                    "caps_ratio": 0.35 if sample[7] else 0.05,
                    "excessive_caps": sample[7],
                    "special_char_ratio": 0.08,
                    "excessive_special_chars": False
                }
                
                explanations = [
                    {
                        "severity": "HIGH" if sample[7] else "LOW",
                        "badge_color": "danger" if sample[7] else "success",
                        "title": "Threat Vector Analysis" if sample[7] else "Verified Safe Pattern",
                        "explanation": f"Statistical model classified as {sample[3]} with multi-signal score {sample[5]}/100.",
                        "evidence": sample[0]
                    }
                ]
                
                pred = PredictionRecord(
                    email_id=em.id,
                    is_spam=sample[7],
                    classification=sample[3],
                    category=sample[4],
                    risk_score=sample[5],
                    risk_level=sample[6],
                    confidence=round(sample[8] * 100, 1),
                    spam_probability=sample[8],
                    ham_probability=sample[9],
                    signals_json=json.dumps(signals),
                    explanations_json=json.dumps(explanations),
                    highlight_spans_json=json.dumps([]),
                    model_version="v1.2.0-svm-prod",
                    created_at=created_dt
                )
                db.add(pred)
                
                # Add sample feedback on a few items
                if idx in [2, 5, 8, 12, 18]:
                    fb = FeedbackRecord(
                        email_id=em.id,
                        prediction_id=pred.id,
                        user_id=admin_user.id,
                        is_correct=True,
                        user_correction=sample[3].capitalize(),
                        comment="Verified by SecOps analyst during triage.",
                        status="APPROVED",
                        model_version="v1.2.0-svm-prod",
                        created_at=created_dt + timedelta(minutes=5)
                    )
                    db.add(fb)
                    
            db.commit()
            print("Successfully seeded historical telemetry records.")
            
    except Exception as e:
        print(f"Seed notice: {e}")
    finally:
        db.close()

# Initialize tables on startup
Base.metadata.create_all(bind=engine)
seed_initial_data()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models and seed DB
    print("Pre-warming ML models and initializing database...")
    get_model_and_vectorizer()
    seed_initial_data()
    print("MailGuard AI engine is ONLINE and ready.")
    yield
    # Shutdown
    print("MailGuard AI shutting down.")

app = FastAPI(
    title="MailGuard AI - Enterprise Email Threat Detection API",
    description="Enterprise REST API for AI-powered email spam, phishing, and threat classification.",
    version="1.2.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(emails.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(model.router, prefix=settings.API_PREFIX)

# Serve Frontend Static Assets
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "MailGuard AI API Engine is running. Visit /docs for OpenAPI specifications."}

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "MailGuard AI",
        "model_version": "v1.2.0-svm-prod",
        "engine": "Calibrated SVM",
        "timestamp": datetime.utcnow().isoformat()
    }
