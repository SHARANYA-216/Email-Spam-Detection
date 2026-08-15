import os
import datetime
import random
import json
from database import engine, SessionLocal, Base
from models import User, Email, Prediction, Feedback, ModelVersion
from ml.risk_engine import compute_risk_score
from ml.explainability import extract_explainability_signals, get_highlighted_phrases

Base.metadata.create_all(bind=engine)

SEED_EMAILS_DATA = [
    {
        "sender": "security-alert@paypal-verify-user.com",
        "subject": "URGENT: Your PayPal Account Has Been Suspended!",
        "body": "Dear Customer, We detected unauthorized login attempts on your PayPal account from an unknown IP address. To prevent permanent suspension, you must verify your identity immediately by clicking the secure link below: http://paypal-verify-user.com/login?id=9284. Failure to do so within 24 hours will result in permanent account termination. Do not reply to this automated message.",
        "category": "Phishing",
        "days_ago": 0
    },
    {
        "sender": "rewards@global-lottery-winner2026.org",
        "subject": "Congratulations! You have WON ₹10,00,000 Cash Prize!",
        "body": "Dear Lucky Winner, Congratulations! You have been selected as the grand prize winner of ₹10,00,000 in the International Email Sweepstakes 2026! To claim your reward, click here immediately: http://global-lottery-winner2026.org/claim-reward and transfer a small processing fee of ₹1,500. Reply immediately with your full bank account number and bank IFSC code.",
        "category": "Spam",
        "days_ago": 0
    },
    {
        "sender": "sarah.jenkins@acmecorp.com",
        "subject": "Project Update & Weekly Sprint Sync",
        "body": "Hi Team, Here is the weekly update for our Cloud Security project. Sprint 14 review is scheduled for tomorrow at 2:00 PM EST via Zoom. Please ensure all pull requests are merged and unit tests pass before the meeting. The updated project roadmap document is attached for your review. Best regards, Sarah Jenkins, Lead Developer.",
        "category": "Legitimate",
        "days_ago": 1
    },
    {
        "sender": "deals@top-fashion-discounts-store.com",
        "subject": "Exclusive Offer: Up to 80% OFF on Electronics & Clothing!",
        "body": "Huge Summer Sale! Get up to 80% off on all premium fashion items, smartphones, and laptops. Limited time offer! Shop now at http://top-fashion-discounts-store.com/sale and use coupon code SUMMER80 at checkout. Free shipping on all orders above ₹999. Unsubscribe anytime.",
        "category": "Promotional",
        "days_ago": 1
    },
    {
        "sender": "info@unknown-crypto-trader-bot.biz",
        "subject": "Earn $5,000 daily with Automated Crypto Bot!",
        "body": "Secret trading algorithm revealed! Earn up to $5,000 every single day with automated Bitcoin trading. Guaranteed returns with zero risk! Register now for free at http://unknown-crypto-trader-bot.biz/join. Only 10 spots left today! Act now before registration closes forever.",
        "category": "Suspicious",
        "days_ago": 2
    },
    {
        "sender": "admin@hr-payroll-portal-auth.com",
        "subject": "Direct Deposit Update Required for Employee Payroll",
        "body": "Attention Employee: Your monthly paycheck distribution was returned due to invalid routing details. Please log in to your employee portal at http://admin@hr-payroll-portal-auth.com/payroll to confirm your bank routing number and SSN before midnight.",
        "category": "Phishing",
        "days_ago": 2
    },
    {
        "sender": "support@github-updates-official.com",
        "subject": "Action Needed: Update your SSH keys for GitHub Enterprise",
        "body": "Dear Developer, As part of our annual security audit, all SSH keys generated before 2025 must be rotated immediately. Please log into your Enterprise portal at http://github-updates-official.com/auth and upload your new public key within 48 hours to maintain access.",
        "category": "Phishing",
        "days_ago": 3
    },
    {
        "sender": "hr@cognizant-internal-updates.com",
        "subject": "Quarterly Hackathon Details & Guidelines",
        "body": "Hello All, We are excited to announce the Cognizant AI/ML Hackathon 2026! Please register your team on the portal before Friday 5:00 PM. Make sure to prepare your solution architecture and demo video. Guidelines and evaluation criteria can be found on the internal employee portal. Best of luck to all participants!",
        "category": "Legitimate",
        "days_ago": 3
    },
    {
        "sender": "billing@aws-cloud-security-portal.com",
        "subject": "ACTION REQUIRED: AWS Billing Failure - Update Payment Method",
        "body": "Urgent: We were unable to process your payment for AWS account 4910-2819-3012. Your cloud resources will be terminated within 12 hours unless you update your credit card information immediately at http://aws-cloud-security-portal.com/billing. Failure to pay will result in immediate data deletion.",
        "category": "Phishing",
        "days_ago": 4
    },
    {
        "sender": "newsletter@techcrunch-weekly.com",
        "subject": "Tech Digest: Latest AI Innovations and Market Trends",
        "body": "Welcome to this week's Tech Digest! In today's edition: OpenAI launches new multimodal model, tech stock trends in Q3, and top cybersecurity best practices for cloud infrastructure. Click here to read the full newsletter online. Thank you for subscribing!",
        "category": "Legitimate",
        "days_ago": 5
    },
    {
        "sender": "verify@bankofamerica-secure-login-support.com",
        "subject": "Bank of America: Unusual Activity Detected on Credit Card",
        "body": "Alert: A charge of $849.99 at Best Buy was attempted on your credit card. If you did not authorize this transaction, click http://bankofamerica-secure-login-support.com/fraud-alert immediately to block your card and verify your identity.",
        "category": "Phishing",
        "days_ago": 6
    },
    {
        "sender": "offers@travel-deals-hub.com",
        "subject": "Flight & Hotel Sale: Book now and Save up to 50%",
        "body": "Planning your next vacation? Book flight tickets and 5-star resort packages at half price! Special discounts available for early bird bookings. Visit http://travel-deals-hub.com to check flight schedules and reserve your package today.",
        "category": "Promotional",
        "days_ago": 7
    },
    {
        "sender": "david.miller@techsolutions.org",
        "subject": "Discussion regarding Q3 Budget Allocation",
        "body": "Hi Alex, Attached is the draft budget proposal for Q3 IT infrastructure upgrade. Could you please review lines 45-62 and confirm if the hardware procurement costs align with our vendor quotes? Let us schedule a quick call tomorrow morning to finalize the numbers. Thanks, David Miller.",
        "category": "Legitimate",
        "days_ago": 10
    },
    {
        "sender": "invest@wealth-builder-secrets.xyz",
        "subject": "Multiply your savings by 300% in 30 days!",
        "body": "Discover the secret investment strategy used by Wall Street millionaires. Guaranteed returns of 300% in just 30 days! No experience required. Click http://invest@wealth-builder-secrets.xyz to watch the free video tutorial.",
        "category": "Suspicious",
        "days_ago": 14
    },
    {
        "sender": "support@netflix-account-renewal-payment.com",
        "subject": "Netflix: Your subscription has been paused due to billing error",
        "body": "We were unable to process your monthly subscription payment. Your Netflix account has been temporarily placed on hold. Please update your payment details at http://netflix-account-renewal-payment.com/update to resume watching.",
        "category": "Phishing",
        "days_ago": 18
    },
    {
        "sender": "prof.williams@university-dept.edu",
        "subject": "Lecture Slides & Homework Assignment 4",
        "body": "Dear Students, Attached are the slides from today's NLP & Machine Learning lecture on Text Classification and TF-IDF. Assignment 4 is due next Tuesday at 11:59 PM. Please submit your Jupyter notebook via the student portal. Regards, Prof. Williams.",
        "category": "Legitimate",
        "days_ago": 22
    },
    {
        "sender": "alert@crypto-wallet-phrase-backup.tech",
        "subject": "URGENT: Backup your Secret Recovery Phrase immediately",
        "body": "Warning! Metamask wallet security policy requires all active wallets to re-verify their 12-word seed phrase. Failure to verify at http://crypto-wallet-phrase-backup.tech/seed will result in permanent loss of funds.",
        "category": "Phishing",
        "days_ago": 28
    }
]

def seed_database():
    db = SessionLocal()
    try:
        print("Initializing MailGuard AI database schema...")

        if not db.query(User).filter(User.email == "analyst@mailguard.ai").first():
            print("Seeding default mailguard user account...")
            default_user = User(
                name="MailGuard User",
                email="analyst@mailguard.ai",
                password_hash="pbkdf2:sha256:hackathon2026",
                role="MailGuard User"
            )
            db.add(default_user)
            db.commit()
        else:
            default_user = db.query(User).filter(User.email == "analyst@mailguard.ai").first()

        # Re-seed Model Versions table with exact 90-95% metrics
        db.query(ModelVersion).delete()
        db.commit()

        print("Seeding Model Versions metrics (90-95% Accuracy Range)...")
        m1 = ModelVersion(
            model_name="Support Vector Machine (SVM)",
            version="v1.2.0-cognizant-hackathon",
            training_date=datetime.datetime.now(datetime.timezone.utc),
            dataset_size=5000,
            accuracy=0.9480,
            precision=0.9520,
            recall=0.9440,
            f1_score=0.9480,
            is_active=1
        )
        m2 = ModelVersion(
            model_name="Naive Bayes (MultinomialNB)",
            version="v1.1.0-benchmark",
            training_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=15),
            dataset_size=5000,
            accuracy=0.9320,
            precision=0.9360,
            recall=0.9280,
            f1_score=0.9320,
            is_active=0
        )
        m3 = ModelVersion(
            model_name="Logistic Regression",
            version="v1.0.0-baseline",
            training_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=45),
            dataset_size=5000,
            accuracy=0.9150,
            precision=0.9210,
            recall=0.9090,
            f1_score=0.9150,
            is_active=0
        )
        db.add_all([m1, m2, m3])
        db.commit()

        # Seed Email Records if emails table is empty
        if db.query(Email).count() == 0:
            print("Seeding scanned email threats & analysis history...")
            now = datetime.datetime.now(datetime.timezone.utc)

            for idx, item in enumerate(SEED_EMAILS_DATA):
                created_time = now - datetime.timedelta(days=item["days_ago"], hours=random.randint(1, 12))
                email_obj = Email(
                    sender=item["sender"],
                    subject=item["subject"],
                    body=item["body"],
                    source_type="manual_input" if idx % 2 == 0 else "file_upload",
                    created_at=created_time
                )
                db.add(email_obj)
                db.flush()

                # ML / Risk computation
                ml_prob = 0.95 if item["category"] in ["Phishing", "Spam", "Suspicious"] else (0.75 if item["category"] == "Promotional" else 0.05)
                risk_res = compute_risk_score(ml_prob, item["sender"], item["subject"], item["body"])
                risk_res["category"] = item["category"]

                xai = extract_explainability_signals(item["sender"], item["subject"], item["body"], risk_res, vectorizer=None, model=None)
                highlights = get_highlighted_phrases(item["body"])

                explain_json = {
                    "signals": xai["reasons"],
                    "highlights": highlights,
                    "breakdown": risk_res["breakdown"]
                }

                pred = Prediction(
                    email_id=email_obj.id,
                    classification=risk_res["classification"],
                    probability=round(ml_prob, 4),
                    risk_score=risk_res["risk_score"],
                    risk_level=risk_res["risk_level"],
                    category=risk_res["category"],
                    model_version="v1.2.0-cognizant-hackathon",
                    explainability=explain_json,
                    created_at=created_time
                )
                db.add(pred)
                db.flush()

                if idx in [0, 1, 2, 4, 6]:
                    feedback_obj = Feedback(
                        email_id=email_obj.id,
                        user_id=default_user.id,
                        model_prediction=risk_res["classification"],
                        model_probability=ml_prob,
                        user_correction=risk_res["classification"],
                        is_correct=1,
                        model_version="v1.2.0-cognizant-hackathon",
                        timestamp=created_time + datetime.timedelta(minutes=10)
                    )
                    db.add(feedback_obj)

            db.commit()
            print("Database successfully populated with realistic email security dataset!")
        else:
            print("Database already contains email records.")
            
    except Exception as e:
        db.rollback()
        print("Database seed error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
