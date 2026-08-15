"""
MailGuard AI - Risk Scoring Engine
Calculates deterministic 0-100 risk score and risk level (LOW, MEDIUM, HIGH)
by combining calibrated ML probability and multi-vector threat signals.
"""

from typing import Dict, Any, Tuple

def compute_risk_score(classification_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a 0-100 risk score and categorical risk level.
    
    Risk scoring factors:
    1. ML Spam Probability: up to 50 points
    2. URL Threat Indicators: up to 25 points (IP URLs, domain mismatches, suspicious TLDs)
    3. Linguistic Urgency & Credential Harvesting: up to 15 points
    4. Prize / Lottery / Advance-fee Triggers: up to 15 points
    5. Structural & Format Anomalies: up to 10 points (Excessive caps, abnormal punctuation)
    """
    spam_prob = classification_data.get("spam_probability", 0.0)
    signals = classification_data.get("signals", {})
    classification = classification_data.get("classification", "LEGITIMATE")
    
    score = 0.0
    breakdown = []
    
    # Factor 1: Machine Learning Probability (0 - 50 points)
    ml_points = spam_prob * 50.0
    score += ml_points
    breakdown.append({
        "factor": "ML Statistical Threat Probability",
        "points": round(ml_points, 1),
        "max": 50,
        "detail": f"Model evaluated spam probability at {round(spam_prob * 100, 1)}%"
    })
    
    # Factor 2: URL & Domain Threat Vectors (0 - 25 points)
    url_points = 0.0
    if len(signals.get("ip_based_urls", [])) > 0:
        url_points += 20.0
        breakdown.append({
            "factor": "Raw IP Address in URL Link",
            "points": 20.0,
            "max": 20,
            "detail": f"Detected {len(signals.get('ip_based_urls'))} URL(s) routing directly to numerical IP addresses instead of trusted domain names."
        })
    elif len(signals.get("suspicious_urls", [])) > 0:
        pts = min(15.0, len(signals.get("suspicious_urls")) * 8.0)
        url_points += pts
        breakdown.append({
            "factor": "Suspicious External Domains / TLDs",
            "points": round(pts, 1),
            "max": 15,
            "detail": f"Identified {len(signals.get('suspicious_urls'))} high-risk external link(s) with suspicious top-level domains or brand spoofing."
        })
        
    if signals.get("domain_mismatch"):
        url_points += 10.0
        breakdown.append({
            "factor": "Sender Domain vs Link Destination Mismatch",
            "points": 10.0,
            "max": 10,
            "detail": "Email sender domain does not match destination domains contained in embedded hyperlinks."
        })
        
    score += min(25.0, url_points)
    
    # Factor 3: Credential Harvesting & Urgency Manipulation (0 - 15 points)
    urgency_points = 0.0
    if signals.get("credential_harvest_detected"):
        urgency_points += 10.0
        breakdown.append({
            "factor": "Credential & Sensitive Data Solicitations",
            "points": 10.0,
            "max": 10,
            "detail": f"Detected solicitations for passwords, logins, bank routing, or direct deposit updates: {', '.join(signals.get('credential_matches', [])[:3])}"
        })
        
    if signals.get("urgency_detected"):
        urgency_points += 7.0
        breakdown.append({
            "factor": "Urgency & Psychological Pressure Language",
            "points": 7.0,
            "max": 7,
            "detail": f"Detected urgent action-demanding phrases: {', '.join(signals.get('urgency_matches', [])[:3])}"
        })
    score += min(15.0, urgency_points)
    
    # Factor 4: Financial & Lottery / Prize Triggers (0 - 15 points)
    prize_points = 0.0
    if signals.get("prize_detected"):
        prize_points += 12.0
        breakdown.append({
            "factor": "Unsolicited Prize / Lottery / Fund Transfer Claims",
            "points": 12.0,
            "max": 12,
            "detail": f"Detected lottery, cash prize, or inheritance payout language: {', '.join(signals.get('prize_matches', [])[:3])}"
        })
    elif signals.get("promo_detected") and classification != "LEGITIMATE":
        prize_points += 6.0
        breakdown.append({
            "factor": "Marketing & Unsolicited Promotional Offers",
            "points": 6.0,
            "max": 6,
            "detail": f"Detected commercial promotional terms: {', '.join(signals.get('promo_matches', [])[:3])}"
        })
    score += min(15.0, prize_points)
    
    # Factor 5: Structural & Typographical Anomalies (0 - 10 points)
    struct_points = 0.0
    if signals.get("excessive_caps"):
        struct_points += 5.0
        breakdown.append({
            "factor": "Excessive Uppercase Text Ratio",
            "points": 5.0,
            "max": 5,
            "detail": f"High uppercase character ratio ({int(signals.get('caps_ratio', 0)*100)}%) typical of spam headers."
        })
    if signals.get("excessive_special_chars"):
        struct_points += 5.0
        breakdown.append({
            "factor": "Anomalous Punctuation & Special Characters",
            "points": 5.0,
            "max": 5,
            "detail": "Elevated density of special characters and symbols."
        })
    score += min(10.0, struct_points)
    
    # Cap total score at 100 and floor at 0
    final_score = int(min(100.0, max(0.0, round(score))))
    
    # Determine Risk Level
    if final_score <= 35:
        risk_level = "LOW"
    elif final_score <= 69:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
        
    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "risk_breakdown": breakdown
    }
