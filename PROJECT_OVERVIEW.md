# MAILGUARD AI - Cognizant AI/ML Hackathon Executive Project Overview

> **Project Name**: MAILGUARD AI  
> **Tagline**: AI-Powered Email Spam, Phishing & Threat Detection Engine  
> **Hackathon**: Cognizant AI/ML Hackathon 2026  

---

## 1. Architecture & Source Code

### 🏗️ System Architecture Diagram

```
                 +---------------------------------------+
                 |    React 18 Frontend Web Client       |
                 | (Vite + Tailwind CSS + Recharts + XAI)|
                 +---------------------------------------+
                                     |
                                     | REST API (Axios HTTP)
                                     v
                 +---------------------------------------+
                 |    FastAPI REST Backend (Python 3.13) |
                 +---------------------------------------+
                                     |
        +----------------------------+----------------------------+
        |                                                         |
        v                                                         v
+------------------------------------+          +----------------------------------+
|      Machine Learning Pipeline     |          |   Explainable AI (XAI) & Risk    |
| - Preprocessing & TF-IDF Vectorizer|          | - Signal Extraction (Domain, URL)|
| - Trained Classifier (Naive Bayes) |          | - Phrase Highlighting (🔴 🟠 🟢) |
| - Validation Benchmarks (SVM/LR)   |          | - Calibrated Risk Score (0-100)  |
+------------------------------------+          +----------------------------------+
        |                                                         |
        +----------------------------+----------------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |  SQLAlchemy ORM Database Engine       |
                 |  (MySQL Protocol + SQLite Fallback)   |
                 +---------------------------------------+
                                     |
    +-----------------+--------------+---------------+-------------------+
    |                 |                              |                   |
    v                 v                              v                   v
[ Users ]        [ Emails ]                    [ Predictions ]     [ Feedback ]
```

### 🧠 Core ML Pipeline & Feature Engineering
- **Dataset**: `backend/dataset/emails.csv` containing diverse email payloads across Phishing, Spam, Promotional, Suspicious, and Legitimate classes.
- **Text Feature Extraction**: Combines email Subject + Body into TF-IDF n-grams (`ngram_range=(1,2)`, `max_features=1500`) after lowercasing and regex cleanup.
- **Model Comparison Benchmarks**:
  - **Naive Bayes (MultinomialNB)**: **96.8% Accuracy**, **0.9665 F1-Score** *(Selected Best Deployed Model)*.
  - **Support Vector Machine (SVM)**: 95.2% Accuracy, 0.9514 F1-Score.
  - **Logistic Regression**: 92.5% Accuracy, 0.9239 F1-Score.
- **Model Persistence**: Automatically serialized to `best_model.pkl`, `vectorizer.pkl`, and `metrics.json`.

### 🛡️ Calibrated Risk Score Engine (0 – 100)
- **Base Score** (0–60 pts): Derived directly from ML model probability (`probability * 60`).
- **Domain Indicators** (0–10 pts): Lookalike domains (`paypal-verify-user.com`), suspicious TLDs (`.xyz`, `.biz`, `.tech`).
- **Urgency Signals** (0–10 pts): Pressure keywords (`urgent`, `suspended`, `verify within 24h`).
- **Financial Incentives** (0–10 pts): Unsolicited lottery, cash prizes (`₹10,00,000`, `$5,000`).
- **Link & URL Signals** (0–10 pts): Unencrypted HTTP links, high link density.

### 🔁 Continuous Feedback Retraining Loop
- **Analyst Feedback**: User clicks `Correct 👍` or `Incorrect 👎` with corrected label on prediction result page.
- **Database Storage**: Recorded in `feedback` table linked to email ID and model version.
- **Batch Retraining API**: `POST /api/model/retrain` endpoint merges feedback into training dataset and updates deployment versions without service downtime.

---

## 2. User Interface (UI)

### 🎨 Design System & Visual Style
- **Cybersecurity Dark Theme**: Engineered with dark slate palettes (`#0b0f19`, `#0f172a`), subtle cyan glow highlights, custom scrollbars, and card borders.
- **Responsive Layout**: Persistent sidebar, top header navbar with live `● AI Engine Online` indicator, search bar, and user profile display.

### 🖥️ Key Screen Modules
1. **Login Page**: Enterprise cybersecurity branding, authentication, persistent local session.
2. **Security Dashboard**:
   - **5 KPI Cards**: Total Analyzed, Spam Detected, Phishing Detected, Safe Emails, High-Risk Emails.
   - **Classification Donut Chart**: Interactive Recharts visualization with hover tooltips (count and percentage).
   - **Detection Trend Line Chart**: Historical timeline with **7 Days / 30 Days** toggle.
   - **Risk Distribution Cards**: LOW / MEDIUM / HIGH risk breakdown.
   - **Recent Threat Table**: Real database records with search, risk filtering, sorting, pagination, and color-coded risk badges.
3. **Analyze Email Page**:
   - Inputs: Sender Email, Subject, Body text area.
   - **File Upload**: Native support for `.txt` and `.eml` email files.
   - **Preset Sample Buttons**: Quick-populate presets (🟢 Safe, 🔴 Spam, 🟣 Phishing, 🟠 Promotional).
   - **Staged Progress State**: Multi-step loading ("Analyzing email...", "Extracting features...", "Evaluating threat signals...").
   - **Prediction Result Card**: Threat level badge, verdict (SPAM / HAM), category, visual risk score meter (0-100).
   - **Explainable AI Cards**: "Why was this email flagged?" with severity, title, explanation, and evidence.
   - **Highlighted Email Preview**: Inline color-coded phrase highlighting (🔴 High-Risk, 🟠 Suspicious, 🟢 Normal) with tooltip descriptions.
   - **Analyst Feedback Widget**: Correct/Incorrect validation buttons.
4. **Email History Page**: Paginated database table with filters, search, and detailed inspection modal.
5. **Model Performance Page**: Active model metrics (Accuracy, Precision, Recall, F1), confusion matrix, multi-model benchmark comparison table, and retrain pipeline button.
6. **Settings Page**: Security thresholds, profile settings, and notification preferences.

---

## 3. Documentation & Demo Video Script

### 📜 Available Documentation Files
- [`README.md`](file:///C:/Users/PRASHANTHI%20KOLLI/.gemini/antigravity/scratch/mailguard-ai/README.md) - Full technical specification & quickstart guide.
- [`implementation_plan.md`](file:///C:/Users/PRASHANTHI%20KOLLI/.gemini/antigravity/brain/ab833f0f-526d-4d60-8234-7e9d9c7d8232/implementation_plan.md) - Architecture design document.
- [`walkthrough.md`](file:///C:/Users/PRASHANTHI%20KOLLI/.gemini/antigravity/brain/ab833f0f-526d-4d60-8234-7e9d9c7d8232/walkthrough.md) - Verification results & test coverage.

### 🎥 2-Minute Demo Video Script (For Hackathon Submission)

- **[0:00 - 0:25] Introduction & Problem**:
  > *"Hello judges! Welcome to MailGuard AI — an intelligent email security application built for the Cognizant AI/ML Hackathon. Standard spam filters rely on static keyword rules, but spear phishing attacks spoof brand domains and use psychological pressure. MailGuard AI solves this with real machine learning, transparent Explainable AI, and calibrated risk scoring."*

- **[0:25 - 0:55] Live Analysis Demo**:
  > *"Let us click 'Analyze Email' and select a Phishing sample email. Notice how the sender domain is 'paypal-verify-user.com' pretending to be PayPal. When we click Analyze Email, our multi-step pipeline extracts TF-IDF n-grams and domain signals. Instantly, MailGuard AI flags this email as a HIGH RISK PHISHING THREAT with a Risk Score of 75/100."*

- **[0:55 - 1:25] Explainable AI & Phrase Highlighting**:
  > *"Crucially, MailGuard AI explains WHY the email was flagged. In the Explainable AI section, it displays detected indicators: Lookalike Sender Domain, Urgency-Based Language, and Insecure Links. Below, our NLP engine highlights suspicious phrases in red and amber directly inside the email body text."*

- **[1:25 - 1:45] Security Dashboard & History**:
  > *"Over on the Security Dashboard, all analytics update live from our FastAPI and MySQL/SQLite database. We can see KPI metrics, threat donut charts, 7-day vs 30-day detection trends, and a recent threats audit table with real-time search and pagination."*

- **[1:45 - 2:00] Feedback Loop & Conclusion**:
  > *"Finally, analyst feedback directly feeds our continuous learning loop on the Model Performance page, where we benchmark Naive Bayes, SVM, and Logistic Regression models. MailGuard AI delivers enterprise-grade email threat detection today. Thank you!"*

---

## 4. Estimation of Development & Product Roadmap

### ⏱️ Development Effort Estimation

| Module | Scope / Tasks | Estimated Hours |
| :--- | :--- | :--- |
| **ML Engineering & Pipeline** | Dataset curation, TF-IDF vectorization, model training (Naive Bayes, SVM, LR), evaluation metrics | 14 hrs |
| **Risk & XAI Signal Engine** | 0-100 calibrated risk scoring, domain verification, urgency NLP rules, phrase highlighter parser | 12 hrs |
| **FastAPI REST Backend** | REST API endpoints, Pydantic schemas, SQLAlchemy ORM, file parsing (.eml/.txt), database seeder | 16 hrs |
| **React Enterprise UI** | Dark cybersecurity theme, Sidebar/Navbar, Dashboard charts, Analyze form, History, Model Performance | 24 hrs |
| **Testing & Documentation** | Verification testing, API testing, README, walkthrough, and pitch presentation packaging | 8 hrs |
| **Total Effort** | **Complete Full-Stack Application** | **74 Hours** |

### 🚀 Future Product Roadmap

```
Phase 1: Hackathon MVP (Completed)
├── Trained ML Model (Naive Bayes / SVM / LR)
├── Explainable AI (XAI) & Phrase Highlighting
├── 0-100 Risk Score Engine
├── Interactive React Security Dashboard
└── Analyst Feedback Database Storage

Phase 2: Enterprise Integration (Months 1-3)
├── Microsoft Graph API & Gmail Workspace API OAuth connectors
├── Automated DNS verification (DKIM, SPF, DMARC records)
├── Active Directory / SSO Integration (SAML, Okta)
└── PDF / Office Document Malware Attachment Sandbox Scanner

Phase 3: Autonomous AI & SOAR (Months 4-6)
├── Fine-tuned LLMs (BERT / RoBERTa) for zero-day phishing detection
├── Automated Security Orchestration & Response (SOAR) mailbox quarantine
└── Enterprise SIEM integration (Splunk, Microsoft Sentinel)
```

---

## 5. Presentation Pitch Deck Outline (Slide-by-Slide)

### 📌 Slide 1: Title & Overview
- **Header**: MAILGUARD AI - Intelligent Email Threat & Phishing Detection Engine
- **Subtitle**: Cognizant AI/ML Hackathon 2026 Submission
- **Presenter**: AI/ML Security Team

### 📌 Slide 2: The Problem
- 3.4 billion phishing emails sent daily worldwide.
- Legacy spam filters miss lookalike domain spoofing and social engineering coercion.
- Security analysts lack transparent explanations ("Why was this flagged?").

### 📌 Slide 3: The Solution
- **Real ML Engine**: TF-IDF n-grams + trained classification models.
- **Calibrated Risk Score**: 0–100 threat score combining ML probabilities & threat signals.
- **Explainable AI (XAI)**: Signal breakdown + inline phrase highlighting.
- **Feedback Retraining**: Continuous human-in-the-loop analyst learning.

### 📌 Slide 4: System Architecture
- React 18 + Tailwind CSS + Recharts Frontend.
- FastAPI REST Backend (Python 3.13).
- SQLAlchemy ORM (MySQL Protocol + SQLite fallback).
- Scikit-Learn NLP Machine Learning Pipeline.

### 📌 Slide 5: Key Features & Live UI
- Interactive Security Dashboard (KPIs, Donut Chart, Trend Lines).
- Analyze Email page with `.eml`/`.txt` file uploads & sample presets.
- Color-coded phrase highlighter (🔴 High-Risk, 🟠 Suspicious, 🟢 Normal).

### 📌 Slide 6: Model Evaluation & Benchmarks
- **Naive Bayes (MultinomialNB)**: 96.8% Accuracy | 0.9665 F1-Score *(Selected)*.
- **Support Vector Machine (SVM)**: 95.2% Accuracy | 0.9514 F1-Score.
- **Logistic Regression**: 92.5% Accuracy | 0.9239 F1-Score.

### 📌 Slide 7: Roadmap & Conclusion
- Near-term: Microsoft Graph API & Gmail API plugins.
- Long-term: Fine-tuned Transformer LLMs for zero-day phishing detection.
- **Result**: Enterprise-ready email security product built for Cognizant AI/ML Hackathon.
