"""
MailGuard AI - Automated Verification & API Test Suite
Tests all endpoints, machine learning predictions, risk scoring, explainability,
continuous learning feedback, and database persistence.
"""

import sys
import os

# Set UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_all_tests():
    print("==================================================")
    print("[*] Starting MailGuard AI Automated Test Suite")
    print("==================================================")

    with TestClient(app) as client:
        # 1. Health check
        print("\n[1/8] Testing Health Check endpoint...")
        resp = client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.text}"
        print("[+] Health Check OK:", resp.json())

        # 2. Authentication
        print("\n[2/8] Testing Analyst Authentication...")
        resp = client.post("/api/auth/login", json={
            "email": "analyst@mailguard.ai",
            "password": "Admin@123",
            "remember_me": True
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token_data = resp.json()
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[+] Auth Login OK: User={token_data['user']['email']}, Role={token_data['user']['role']}")

        # 3. Analyze Safe Email
        print("\n[3/8] Testing Safe Email Analysis...")
        safe_payload = {
            "sender": "sarah.jenkins@acmecorp.com",
            "subject": "Sprint 42 Planning & Architecture Alignment",
            "body": "Hi Prashanthi, please review the sprint backlog and join the architecture sync tomorrow at 10 AM. Best, Sarah."
        }
        resp = client.post("/api/emails/analyze", json=safe_payload, headers=headers)
        assert resp.status_code == 200, f"Safe email analysis failed: {resp.text}"
        safe_res = resp.json()
        print(f"[+] Safe Analysis Result: Class={safe_res['classification']}, RiskScore={safe_res['risk_score']}, Level={safe_res['risk_level']}")
        assert safe_res["is_spam"] == False or safe_res["risk_score"] <= 35, "Expected low risk for safe email"
        assert len(safe_res["explanations"]) > 0, "Expected XAI explanations"
        assert len(safe_res["highlight_spans"]) > 0, "Expected highlighted text spans"

        # 4. Analyze Phishing Email
        print("\n[4/8] Testing Phishing Email Analysis...")
        phishing_payload = {
            "sender": "security-alert@microsoft-services-auth.com",
            "subject": "URGENT: Office 365 Account Scheduled for Immediate Deletion",
            "body": "Dear Employee, Your Office 365 mailbox will expire in 2 hours. Verify password at http://185.220.101.5/recover immediately or account will be deactivated."
        }
        resp = client.post("/api/emails/analyze", json=phishing_payload, headers=headers)
        assert resp.status_code == 200, f"Phishing analysis failed: {resp.text}"
        phishing_res = resp.json()
        print(f"[+] Phishing Analysis Result: Class={phishing_res['classification']}, Category={phishing_res['category']}, RiskScore={phishing_res['risk_score']}, Level={phishing_res['risk_level']}")
        assert phishing_res["is_spam"] == True, "Expected spam flag for phishing email"
        assert phishing_res["risk_score"] >= 70, "Expected high risk score >= 70"
        assert any(exp["severity"] in ["CRITICAL", "HIGH"] for exp in phishing_res["explanations"]), "Expected high severity XAI reasons"

        # 5. User Feedback
        print("\n[5/8] Testing User Feedback Submission...")
        email_id = phishing_res["email_id"]
        resp = client.post(f"/api/emails/{email_id}/feedback", json={
            "is_correct": True,
            "user_correction": "Phishing",
            "comment": "Verified credential theft attempt by analyst."
        }, headers=headers)
        assert resp.status_code == 200, f"Feedback submission failed: {resp.text}"
        fb_res = resp.json()
        print(f"[+] Feedback OK: ID={fb_res['id']}, Status={fb_res['status']}")

        # 6. Dashboard Stats & Trends
        print("\n[6/8] Testing Dashboard APIs...")
        resp = client.get("/api/dashboard/stats", headers=headers)
        assert resp.status_code == 200, f"Stats failed: {resp.text}"
        stats = resp.json()
        print(f"[+] Dashboard Stats: Total={stats['total_emails']}, Spam={stats['spam_detected']}, Safe={stats['safe_emails']}, HighRisk={stats['high_risk_emails']}")
        assert stats["total_emails"] > 0, "Expected non-zero total emails"

        resp_trends = client.get("/api/dashboard/trends?timeframe=7d", headers=headers)
        assert resp_trends.status_code == 200
        assert len(resp_trends.json()["points"]) == 7, "Expected 7 trend points"

        resp_dist = client.get("/api/dashboard/risk-distribution", headers=headers)
        assert resp_dist.status_code == 200
        assert len(resp_dist.json()["categories"]) > 0, "Expected classification categories"

        # 7. Model Performance & Evaluation
        print("\n[7/8] Testing Model Performance API...")
        resp = client.get("/api/model/performance", headers=headers)
        assert resp.status_code == 200, f"Model performance failed: {resp.text}"
        perf = resp.json()
        print(f"[+] Model Champion: {perf['active_model']} | Accuracy={perf['champion_metrics']['accuracy']*100:.2f}% | F1={perf['champion_metrics']['f1_score']:.4f}")
        assert perf["champion_metrics"]["accuracy"] >= 0.85, "Accuracy should be >= 85%"

        # 8. Email History & Search
        print("\n[8/8] Testing Email History & Detail View...")
        resp = client.get("/api/emails/history?page=1&page_size=5", headers=headers)
        assert resp.status_code == 200
        history_data = resp.json()
        assert len(history_data["items"]) > 0, "Expected history records"
        first_id = history_data["items"][0]["id"]

        resp_detail = client.get(f"/api/emails/{first_id}", headers=headers)
        assert resp_detail.status_code == 200
        detail_data = resp_detail.json()
        assert detail_data["id"] is not None
        print(f"[+] Email Detail Fetch OK: ID={detail_data['id']}, Subject={detail_data['subject']}")

    print("\n==================================================")
    print("[SUCCESS] ALL TESTS PASSED (8/8)!")
    print("==================================================")

def test_new_user_auto_registers_on_login():
    with TestClient(app) as client:
        email = "new-user-auto-register@example.com"
        resp = client.post("/api/auth/login", json={
            "email": email,
            "password": "NewUser@123",
            "remember_me": True
        })
        assert resp.status_code == 200, f"New user login should auto-register: {resp.text}"
        data = resp.json()
        assert data["user"]["email"] == email, data
        user = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert user.status_code == 200, user.text

if __name__ == "__main__":
    run_all_tests()
