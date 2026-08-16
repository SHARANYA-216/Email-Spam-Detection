# MAILGUARD AI — Project Overview

## 1. Project Information

**Project Name:** MailGuard AI  
**Project Type:** Full-Stack AI/ML Email Security Application  
**Purpose:** Detect spam and suspicious emails, explain the prediction, calculate risk, and allow users to analyze messages from manual input or Gmail.

### Live Application

- **Frontend:** https://mailguardai-frontend.onrender.com
- **Backend:** https://email-spam-detection-oyhu.onrender.com
- **Swagger API Docs:** https://email-spam-detection-oyhu.onrender.com/docs
- **Health Check:** https://email-spam-detection-oyhu.onrender.com/health

---

## 2. What the Project Does

MailGuard AI provides an end-to-end workflow:

```text
User
 │
 ▼
Login / Registration
 │
 ├───────────────┐
 ▼               ▼
Manual Email     Gmail Inbox
Analysis         Integration
 │               │
 └───────┬───────┘
         ▼
   Email Preprocessing
         │
         ▼
    ML Classification
         │
         ├── Ham / Legitimate
         └── Spam / Threat
         │
         ▼
   Threat Category
         │
         ▼
     Risk Scoring
         │
         ▼
  Explainable Result
         │
         ▼
 Dashboard / History / Feedback
```

---

## 3. Main Application Modules

### Frontend

The frontend is built with React and Vite.

Major screens/components:

- Landing Page
- Login / Registration
- Dashboard
- Email Analysis
- Gmail Inbox
- Email History
- Model Performance
- Settings
- Navigation Sidebar/Navbar

The frontend uses Axios for backend communication, Tailwind CSS for styling, Lucide React for icons, and Recharts for visualizations.

### Backend

The active backend implementation is:

```text
backend/main.py
```

It is built using FastAPI and provides:

- JWT authentication
- Email analysis
- Email history
- Dashboard analytics
- Model performance
- Feedback
- Model retraining
- Gmail OAuth
- Gmail inbox retrieval
- Gmail email retrieval

### Machine Learning

The production model artifacts are stored under:

```text
backend/ml/saved_models/
```

Files:

- `best_model.pkl`
- `vectorizer.pkl`
- `metrics.json`

The training implementation is:

```text
backend/ml/train_model.py
```

---

## 4. Machine Learning Architecture

```text
Subject + Body
      │
      ▼
Text Cleaning
      │
      ▼
TF-IDF Vectorization
      │
      ▼
Candidate Models
 ┌────┼─────────────┐
 ▼    ▼             ▼
SVM  Naive Bayes  Logistic Regression
 │
 ▼
Best F1 Model
 │
 ▼
Spam/Ham Prediction
 │
 ├── Probability
 └── Classification
```

### TF-IDF Configuration

- `max_features = 1500`
- `ngram_range = (1, 2)`
- `sublinear_tf = True`
- English stop words enabled
- `min_df = 2`

---

## 5. Dataset

File:

```text
backend/dataset/emails.csv
```

Dataset size:

**5,000 emails**

Columns:

```text
sender
subject
body
category
label
```

Class distribution:

| Label | Meaning | Count |
|---:|---|---:|
| 0 | Ham / Legitimate | 2,478 |
| 1 | Spam / Threat | 2,522 |

Training split:

- 80% training = 4,000
- 20% testing = 1,000

The split is stratified and uses `random_state=42`.

---

## 6. Model Benchmark

The stored production metrics report:

| Model | Accuracy | Precision | Recall | F1 |
|---|---:|---:|---:|---:|
| **Calibrated Linear SVM** | **89.50%** | **89.98%** | **89.09%** | **0.8953** |
| Multinomial Naive Bayes | 89.50% | 89.98% | 89.09% | 0.8953 |
| Logistic Regression | 89.50% | 89.98% | 89.09% | 0.8953 |

### Confusion Matrix

```text
                  Predicted
                Ham     Spam
Actual Ham      446      50
Actual Spam      55     449
```

The SVM is stored as the active production model in:

```text
backend/ml/saved_models/best_model.pkl
```

---

## 7. Threat Detection Layer

The ML classifier is combined with deterministic threat-pattern analysis.

The application checks for patterns related to:

- Banking scams
- Credential theft
- Malware
- Financial scams
- Promotional scams
- Lottery scams
- Urgency-based scams
- Spoofed spam
- Sexual harassment scams
- Money scams

Additional signals include:

- Suspicious links
- IP-based URLs
- Domain mismatch
- Credential requests
- Urgency indicators
- Prize/lottery indicators
- Financial language
- Promotional language
- Excessive capitalization
- Special-character anomalies

---

## 8. Explainability

For each analyzed email, the backend can return information explaining the result.

The explanation layer supports:

- Detected threat signals
- Evidence text
- Threat category
- Risk level
- ML probability
- Highlighted suspicious phrases

The objective is to help the user understand **why** the email was classified as suspicious instead of showing only a binary label.

---

## 9. Risk Scoring

The risk engine combines:

```text
ML Probability
      +
URL / Domain Signals
      +
Urgency Signals
      +
Credential Signals
      +
Financial / Lottery Signals
      +
Structural Text Signals
      │
      ▼
Final Risk Score
      │
      ▼
Risk Level
```

This creates a second security layer around the statistical ML prediction.

---

## 10. Gmail Integration

MailGuard AI includes Gmail API integration using Google OAuth 2.0.

Flow:

```text
MailGuard Login
      │
      ▼
Connect Gmail
      │
      ▼
Google OAuth
      │
      ▼
Permission Granted
      │
      ▼
Gmail Inbox
      │
      ▼
Select Email
      │
      ▼
Analyze with MailGuard AI
```

Backend endpoints include:

```text
GET /api/gmail/auth-url
GET /api/gmail/inbox
GET /api/gmail/email/{message_id}
GET /gmail/callback
```

Production callback:

```text
https://email-spam-detection-oyhu.onrender.com/gmail/callback
```

Required environment variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

---

## 11. Database Architecture

The active root backend uses PostgreSQL through SQLAlchemy.

The database stores application information such as:

- Users
- Emails
- Predictions
- Feedback
- Model-related records

The database connection is supplied through:

```env
DATABASE_URL=postgresql+psycopg2://username:password@host:5432/database
```

The deployed backend does not rely on the repository's local SQLite database for production persistence.

---

## 12. API Architecture

The FastAPI backend exposes REST endpoints under:

```text
/api
```

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
```

### Email

```text
POST   /api/emails/analyze
GET    /api/emails/history
GET    /api/emails/{email_id}
POST   /api/emails/{email_id}/analyze
POST   /api/emails/{email_id}/feedback
DELETE /api/emails/{email_id}
```

### Dashboard

```text
GET /api/dashboard/stats
GET /api/dashboard/trends
GET /api/dashboard/risk-distribution
GET /api/dashboard/recent-threats
GET /api/categories
```

### Model

```text
GET  /api/model/performance
POST /api/model/retrain
```

### API Documentation

```text
https://email-spam-detection-oyhu.onrender.com/docs
```

---

## 13. Deployment Architecture

```text
                    INTERNET
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────────┐   ┌────────────────────────┐
│ Render Frontend     │   │ Render Backend          │
│ React + Vite        │──▶│ FastAPI + ML            │
│                     │   │                         │
│ mailguardai-        │   │ email-spam-detection-  │
│ frontend.onrender   │   │ oyhu.onrender.com      │
│ .com                │   │                         │
└─────────────────────┘   └───────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  PostgreSQL                 Gmail API
```

---

## 14. Repository Structure

```text
MailGuardAI/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── seed_data.py
│   ├── test_api.py
│   ├── dataset/
│   │   └── emails.csv
│   └── ml/
│       ├── train_model.py
│       ├── explainability.py
│       ├── risk_engine.py
│       └── saved_models/
│           ├── best_model.pkl
│           ├── vectorizer.pkl
│           └── metrics.json
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── components/
│       └── services/
│
├── requirements.txt
├── README.md
└── PROJECT_OVERVIEW.md
```

The uploaded repository also contains an alternate/older `backend/app/` implementation and related artifacts. The deployed frontend configuration points to the root `backend/main.py` API, so this overview treats the root backend as the active application path.

---

## 15. Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local API

```text
http://127.0.0.1:8000
```

### Local Swagger

```text
http://127.0.0.1:8000/docs
```

---

## 16. Model Retraining

Run from the backend directory:

```bash
python ml/train_model.py
```

This loads the dataset, trains the candidate models, evaluates them, selects the best model, and updates:

```text
backend/ml/saved_models/best_model.pkl
backend/ml/saved_models/vectorizer.pkl
backend/ml/saved_models/metrics.json
```

The application also exposes:

```text
POST /api/model/retrain
```

for the application-level retraining workflow.

---

## 17. Environment Variables

Production backend configuration should include:

```env
DATABASE_URL=postgresql+psycopg2://username:password@host:5432/database
JWT_SECRET=your_secure_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://email-spam-detection-oyhu.onrender.com/gmail/callback
```

Never commit real secrets to GitHub.

---

## 18. Future Scope

- SPF/DKIM/DMARC verification
- URL reputation services
- Attachment malware analysis
- Advanced phishing/BEC detection
- LLM-powered explanations
- SIEM/SOAR integration
- Model drift monitoring
- Automated scheduled retraining
- Improved Gmail synchronization

---

## 19. Final Summary

MailGuard AI combines:

**React + FastAPI + PostgreSQL + Gmail API + NLP + TF-IDF + Calibrated SVM + Explainable Threat Signals + Risk Scoring**

to provide a practical end-to-end email security platform.

**Live Frontend:**  
https://mailguardai-frontend.onrender.com

**Live Backend:**  
https://email-spam-detection-oyhu.onrender.com

**API Documentation:**  
https://email-spam-detection-oyhu.onrender.com/docs