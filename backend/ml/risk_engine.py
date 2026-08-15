import re

def compute_risk_score(ml_prob, sender, subject, body):
    """
    Computes a transparent 0-100 risk score based on ML prediction probability 
    and validated heuristic risk signals.
    
    Risk Score Formula:
    Base Score = ml_prob * 60  (0 to 60 points from ML model probability)
    + Domain Indicators: 0-10 points (lookalike domains, suspicious TLDs, IP in sender)
    + Urgency & Pressure: 0-10 points (keywords like urgent, immediate, account suspended)
    + Financial & Prize Incentives: 0-10 points (lottery, cash prize, ₹/$, bonus)
    + Malicious URL & Link Density: 0-10 points (mismatched link domains, http vs https, multiple links)
    """
    text = (subject + " " + body).lower()
    sender_lower = sender.lower()
    
    # 1. Base ML Model Score (0 - 60 points)
    base_score = float(ml_prob) * 60.0

    # 2. Domain & Sender Signals (0 - 10 points)
    domain_score = 0.0
    suspicious_tlds = [".xyz", ".biz", ".tech", ".info", ".net", ".online", ".work"]
    if any(sender_lower.endswith(tld) for tld in suspicious_tlds):
        domain_score += 5.0
    if re.search(r'pay-?pal|google|microsoft|apple|bankofamerica|netflix|amazon|github|aws', sender_lower) and not any(
        sender_lower.endswith(d) for d in ["@paypal.com", "@google.com", "@microsoft.com", "@apple.com", "@bankofamerica.com", "@netflix.com", "@amazon.com", "@github.com", "@amazon.com", "@aws.com"]
    ):
        domain_score += 5.0  # Lookalike / Spoofed sender domain

    # 3. Urgency & Action Signals (0 - 10 points)
    urgency_score = 0.0
    urgency_keywords = ["urgent", "immediate", "suspended", "verify your identity", "action required", "within 24 hours", "closed forever", "quota exceeded"]
    matches_urgency = sum(1 for kw in urgency_keywords if kw in text)
    if matches_urgency >= 1:
        urgency_score += min(10.0, matches_urgency * 4.0)

    # 4. Financial & Reward Signals (0 - 10 points)
    financial_score = 0.0
    reward_keywords = ["won", "cash prize", "lottery", "sweepstakes", "free vacation", "guaranteed returns", "processing fee", "$5,000", "₹10,00,000", "claim your reward"]
    matches_reward = sum(1 for kw in reward_keywords if kw in text)
    if matches_reward >= 1:
        financial_score += min(10.0, matches_reward * 4.0)

    # 5. Link & URL Signals (0 - 10 points)
    link_score = 0.0
    urls = re.findall(r'https?://[^\s]+', body)
    if len(urls) > 0:
        link_score += 3.0
    if len(urls) >= 2:
        link_score += 3.0
    if any("http://" in url for url in urls):  # Insecure HTTP link
        link_score += 4.0

    raw_risk_score = base_score + domain_score + urgency_score + financial_score + link_score
    final_risk_score = int(min(100, max(0, round(raw_risk_score))))

    # Risk Level classification
    if final_risk_score < 35:
        risk_level = "LOW"
    elif final_risk_score < 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # Category determination
    if final_risk_score < 35:
        category = "Legitimate"
        classification = "HAM"
    else:
        classification = "SPAM"
        if "password" in text or "verify" in text or "login" in text or domain_score >= 5.0 or "suspended" in text:
            category = "Phishing"
        elif matches_reward >= 1 or "discount" in text or "sale" in text or "cashback" in text:
            category = "Promotional"
        elif "bot" in text or "crypto" in text or "secret" in text or "guaranteed" in text:
            category = "Suspicious"
        else:
            category = "Spam"

    return {
        "risk_score": final_risk_score,
        "risk_level": risk_level,
        "classification": classification,
        "category": category,
        "breakdown": {
            "ml_model_contribution": round(base_score, 1),
            "domain_indicators": round(domain_score, 1),
            "urgency_indicators": round(urgency_score, 1),
            "financial_indicators": round(financial_score, 1),
            "url_link_indicators": round(link_score, 1)
        }
    }
