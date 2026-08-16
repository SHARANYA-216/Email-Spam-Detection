# MailGuard AI — AI-Powered Email Spam & Threat Detection

MailGuard AI is a full-stack web application for detecting spam and suspicious emails using machine learning, NLP-based text classification, rule-based threat signals, explainable results, risk scoring, email history, analytics, and Gmail inbox integration.

The project contains a React/Vite frontend and a FastAPI/Python backend. The backend loads a trained TF-IDF + calibrated Linear SVM model and exposes REST APIs for authentication, email analysis, history, analytics, model performance, feedback, retraining, and Gmail OAuth integration.

---

## Live Deployment

| Service | URL |
|---|---|
| **Frontend** | https://mailguardai-frontend.onrender.com |
| **Backend API** | https://email-spam-detection-oyhu.onrender.com |
| **Backend Health Check** | https://email-spam-detection-oyhu.onrender.com/health |
| **API Documentation (Swagger)** | https://email-spam-detection-oyhu.onrender.com/docs |

> The frontend is configured to communicate with the deployed backend at `https://email-spam-detection-oyhu.onrender.com/api`.

---

## Project Overview

MailGuard AI analyzes an email using multiple signals:

1. **Machine Learning Classification** — classifies an email as Spam/Threat or Ham/Legitimate.
2. **TF-IDF NLP Pipeline** — converts subject and body text into numerical features.
3. **Calibrated Linear SVM** — provides the production ML prediction and probability.
4. **Threat Category Detection** — identifies categories such as banking scams, credential theft, malware, financial scams, promotional scams, lottery scams, urgency-based scams, and spoofed spam.
5. **Risk Scoring** — combines ML probability with URL, urgency, credential, financial, and structural signals.
6. **Explainability** — provides reasons and evidence for the classification.
7. **Email History** — stores analyzed emails and predictions.
8. **Dashboard Analytics** — displays statistics, trends, risk distribution, and recent threats.
9. **Feedback Learning** — allows users to mark predictions as correct or incorrect and supports model retraining.
10. **Gmail Integration** — connects to a Gmail account through Google OAuth and retrieves inbox messages for analysis.

---

## Key Features

### Landing Page
- MailGuard AI branding
- Get Started and Login flows
- Responsive modern interface

### Authentication
- User registration
- User login
- JWT-based authentication
- Remember-me session handling
- Protected application routes

### Email Analysis
- Sender validation
- Subject and body validation
- ML-based spam/ham classification
- Spam probability and confidence
- Threat category
- Risk score and risk level
- Explainable threat signals
- Phrase highlighting
- Analyze individual emails from Gmail

### Gmail Inbox Integration
- Google OAuth authentication
- Gmail inbox retrieval
- Open individual Gmail messages
- Send a selected Gmail message to the analysis workflow
- Gmail OAuth callback handling

### Dashboard
- Total analyzed emails
- Spam/threat count
- Safe/ham count
- High-risk count
- Trend data
- Risk distribution
- Recent threat records

### History
- Previously analyzed emails
- Detailed prediction information
- Search/filter support
- Feedback submission
- Delete email records

### Model Performance
- Active model information
- Accuracy, precision, recall, and F1 score
- Confusion matrix
- Model comparison
- Retraining trigger

### Settings
- User/session-related application settings and controls

---

## System Architecture

```text
                         ┌───────────────────────────────┐
                         │       React + Vite Frontend    │
                         │                               │
                         │ Landing / Login / Dashboard   │
                         │ Analyze / History / Gmail     │
                         │ Model Performance / Settings  │
                         └───────────────┬───────────────┘
                                         │
                              REST API / JWT / OAuth
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │       FastAPI Backend          │
                         │       Python REST API          │
                         │                               │
                         │ Auth | Emails | Dashboard     │
                         │ Model | Gmail OAuth           │
                         └───────┬───────────┬───────────┘
                                 │           │
                    ┌────────────┘           └─────────────┐
                    ▼                                      ▼
          ┌──────────────────────┐               ┌───────────────────┐
          │ ML + Threat Engine   │               │ PostgreSQL DB     │
          │                      │               │                   │
          │ TF-IDF Vectorizer    │               │ Users             │
          │ Calibrated Linear SVM│               │ Emails            │
          │ Risk Engine          │               │ Predictions       │
          │ Threat Categories    │               │ Feedback          │
          │ Explainability       │               │ Model Information │
          └──────────────────────┘               └───────────────────┘

                         ┌───────────────────────────────┐
                         │          Gmail API             │
                         │       Google OAuth 2.0         │
                         └───────────────────────────────┘
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Axios |
| UI / Icons | Lucide React |
| Charts | Recharts |
| Backend | Python, FastAPI, Uvicorn |
| Authentication | JWT, bcrypt |
| Database | PostgreSQL, SQLAlchemy |
| Machine Learning | Scikit-learn |
| NLP | TF-IDF Vectorization |
| ML Models | Calibrated Linear SVM, Naive Bayes, Logistic Regression |
| Model Serialization | Joblib |
| Data Processing | Pandas, NumPy |
| Gmail | Gmail API, Google OAuth 2.0 |
| Deployment | Render |

---

## Machine Learning Pipeline

```text
Email
  │
  ├── Sender
  ├── Subject
  └── Body
       │
       ▼
Text Combination & Cleaning
       │
       ▼
Lowercase + Special Character Normalization
       │
       ▼
TF-IDF Vectorization
       │
       ▼
Candidate Models
 ┌─────┼───────────────┐
 ▼     ▼               ▼
SVM   Naive Bayes   Logistic Regression
 │
 ▼
Selected Production Model
Calibrated Linear SVM
 │
 ├── Spam/Ham Prediction
 ├── Probability
 └── ML Classification Signal
       │
       ▼
Threat / Risk Engine
       │
       ├── URL signals
       ├── Urgency signals
       ├── Credential signals
       ├── Financial / lottery signals
       └── Structural text signals
       │
       ▼
Final Classification + Category + Risk Score
```

---

## Dataset

The repository contains a curated dataset at:

```text
backend/dataset/emails.csv
```

Dataset characteristics:

- **5,000 email records**
- Columns: `sender`, `subject`, `body`, `category`, `label`
- `label = 0` → Ham / Legitimate
- `label = 1` → Spam / Threat
- 2,478 Ham records
- 2,522 Spam/Threat records

The training script performs an 80/20 stratified train/test split:

- Training: 4,000 records
- Test: 1,000 records

---

## Model Configuration

The production training script is:

```text
backend/ml/train_model.py
```

The TF-IDF vectorizer uses:

- Maximum features: 1,500
- N-grams: unigrams + bigrams `(1, 2)`
- Sublinear TF: enabled
- English stop words: removed
- Minimum document frequency: 2

Candidate models:

1. Support Vector Machine — Calibrated LinearSVC
2. Multinomial Naive Bayes
3. Logistic Regression

The model with the best held-out F1 score is saved as:

```text
backend/ml/saved_models/best_model.pkl
```

The vectorizer is saved as:

```text
backend/ml/saved_models/vectorizer.pkl
```

Model metadata is stored in:

```text
backend/ml/saved_models/metrics.json
```

---

## Current Model Benchmark

The repository's stored production benchmark reports:

| Model | Accuracy | Precision | Recall | F1 Score |
|---|---:|---:|---:|---:|
| **Support Vector Machine (Linear SVM)** | **89.50%** | **89.98%** | **89.09%** | **0.8953** |
| Multinomial Naive Bayes | 89.50% | 89.98% | 89.09% | 0.8953 |
| Logistic Regression | 89.50% | 89.98% | 89.09% | 0.8953 |

### Production Confusion Matrix

| Actual / Predicted | Ham | Spam |
|---|---:|---:|
| **Ham** | 446 | 50 |
| **Spam** | 55 | 449 |

These values are taken from the versioned model metrics included in the uploaded project. They should not be replaced by claims from a different training artifact unless that artifact is actually deployed.

---

## Threat Categories

The backend contains category rules for common suspicious email patterns, including:

- Banking Scam
- Credential Theft
- Malware
- Financial Scam
- Promotional Scam
- Lottery Scam
- Urgency-Based Scam
- Spoofed Spam
- Sexual Harassment Scam
- Money Scam

The category engine uses keyword/pattern signals in addition to the ML classification.

---

## Risk Scoring

MailGuard AI combines the ML result with additional threat indicators.

Signals include:

- Suspicious URLs
- IP-based URLs
- Sender/domain mismatch
- Credential harvesting language
- Urgency and pressure language
- Lottery/prize indicators
- Financial scam indicators
- Promotional indicators
- Excessive capitalization
- Special-character anomalies

The resulting risk score is presented to the user with an associated risk level.

---

## Explainable AI

The application is designed to provide more than a binary prediction.

For flagged messages, the backend can return:

- Threat signals
- Evidence associated with the signal
- Threat category
- Risk level
- Highlighted suspicious phrases
- ML probability
- Classification explanation

This makes the prediction easier to understand during email investigation.

---

## REST API

The deployed backend exposes Swagger documentation at:

**https://email-spam-detection-oyhu.onrender.com/docs**

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
```

### Gmail

```text
GET /api/gmail/auth-url
GET /api/gmail/inbox
GET /api/gmail/email/{message_id}
GET /gmail/callback
```

### Email Analysis

```text
POST /api/emails/analyze
GET  /api/emails/history
GET  /api/emails/{email_id}
POST /api/emails/{email_id}/analyze
POST /api/emails/{email_id}/feedback
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

---

## Gmail Integration Flow

```text
User logs into MailGuard AI
          │
          ▼
Open Gmail Inbox
          │
          ▼
Click Connect Gmail
          │
          ▼
Google OAuth 2.0
          │
          ▼
Gmail permission granted
          │
          ▼
MailGuard AI retrieves inbox messages
          │
          ▼
Select an email
          │
          ▼
Open email details
          │
          ▼
Send email to MailGuard AI analysis
          │
          ▼
ML Classification + Risk Analysis
```

### Gmail Configuration

The backend uses these environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://email-spam-detection-oyhu.onrender.com/gmail/callback
```

The Google Cloud OAuth configuration must use the deployed callback URL above.

---

## Database

The deployed backend uses **PostgreSQL**.

The database connection is configured through:

```env
DATABASE_URL=postgresql+psycopg2://username:password@host:5432/database
```

The backend validates that a PostgreSQL connection is supplied; SQLite is not used as the deployment database for the active backend.

---

## Project Structure

```text
MailGuardAI/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── seed_data.py
│   ├── test_api.py
│   │
│   ├── dataset/
│   │   ├── emails.csv
│   │   └── generate_dataset.py
│   │
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
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardView.jsx
│   │   │   ├── AnalyzeView.jsx
│   │   │   ├── HistoryView.jsx
│   │   │   ├── GmailInboxView.jsx
│   │   │   ├── ModelPerformanceView.jsx
│   │   │   ├── SettingsView.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   └── services/
│   │       ├── api.js
│   │       ├── gmailService.js
│   │       └── demoData.js
│   │
│   └── public/
│
├── requirements.txt
├── README.md
└── PROJECT_OVERVIEW.md
```

> The uploaded repository also contains older/alternate backend artifacts under `backend/app/`. The deployed frontend is configured against the root `backend/main.py` API implementation and its `backend/ml/saved_models/` artifacts. The documentation above describes that active application path.

---

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- PostgreSQL
- Google Cloud project with Gmail API enabled if Gmail integration is required

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd MailGuardAI
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r ../requirements.txt
```

Configure the backend environment variables:

```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/mailguard_db
JWT_SECRET=your_secure_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/gmail/callback
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display the local frontend URL in the terminal.

> For local Gmail testing, make sure the frontend Gmail service points to the local backend and the Google OAuth redirect URI matches the local backend callback. For the deployed application, the frontend API service is configured to use the Render backend.

---

## Model Training

From the `backend` directory:

```bash
python ml/train_model.py
```

The training process:

1. Loads `backend/dataset/emails.csv`
2. Cleans and combines subject/body text
3. Creates TF-IDF features
4. Trains the candidate classifiers
5. Evaluates the models
6. Selects the best model using F1 score
7. Saves the trained classifier
8. Saves the TF-IDF vectorizer
9. Updates the metrics file

---

## API Testing

The repository contains:

```text
backend/test_api.py
```

Run it according to the test file's configured environment and database requirements.

---

## Deployment

### Frontend — Render

The frontend is deployed at:

**https://mailguardai-frontend.onrender.com**

The frontend's API service is configured to call:

```text
https://email-spam-detection-oyhu.onrender.com/api
```

### Backend — Render

The backend is deployed at:

**https://email-spam-detection-oyhu.onrender.com**

Health endpoint:

```text
https://email-spam-detection-oyhu.onrender.com/health
```

Swagger:

```text
https://email-spam-detection-oyhu.onrender.com/docs
```

For the backend deployment, configure the required PostgreSQL, JWT, and Google OAuth environment variables in Render.

---

## Security Notes

- Never commit `.env` files or Google OAuth secrets.
- Use a strong production `JWT_SECRET`.
- Keep Google OAuth client secrets private.
- Restrict OAuth redirect URIs to the required domains.
- Use HTTPS in production.
- Use a managed PostgreSQL database for persistent deployment data.
- Do not use development credentials in a public deployment.

---

## Future Scope

1. SPF, DKIM, and DMARC verification
2. More advanced URL reputation analysis
3. Attachment scanning and sandboxing
4. Improved phishing and BEC detection
5. LLM-assisted threat explanations
6. SIEM/SOAR integrations
7. Scheduled model monitoring and drift detection
8. More robust Gmail synchronization and mailbox-level analysis

---

## Project Purpose

MailGuard AI demonstrates how machine learning, NLP, explainable threat signals, web application development, database persistence, authentication, and Gmail API integration can be combined into a practical email security application.

**MailGuard AI — Detect. Explain. Protect.**