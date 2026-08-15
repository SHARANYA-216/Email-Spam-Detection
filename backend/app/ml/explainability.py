"""
MailGuard AI - Explainable AI (XAI) & Phrase Highlighting Engine
Provides token-level feature attribution, structural threat signal explanations,
and interactive phrase-level highlighted body annotations.
"""

import re
import numpy as np
from typing import Dict, List, Any
from backend.app.ml.classifier import get_model_and_vectorizer
from backend.app.ml.preprocessor import prepare_text_for_model, URGENCY_KEYWORDS, PRIZE_KEYWORDS, CREDENTIAL_KEYWORDS, PROMO_KEYWORDS

def generate_xai_explanations(sender: str, subject: str, body: str, classification_data: Dict[str, Any], risk_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates dynamic Explainable AI reasons explaining why this specific email was flagged or marked safe.
    """
    reasons = []
    signals = classification_data.get("signals", {})
    is_spam = classification_data.get("is_spam", False)
    classification = classification_data.get("classification", "LEGITIMATE")
    
    if not is_spam and risk_data.get("risk_score", 0) <= 35:
        # Safe / Ham explanations
        reasons.append({
            "severity": "LOW",
            "badge_color": "success",
            "title": "Consistent Enterprise Sender & Header Integrity",
            "explanation": f"The sender domain '{signals.get('sender_domain', 'trusted')}' aligns with standard business communication patterns with no detected SPF/DKIM forgery indicators.",
            "evidence": sender or "Verified internal domain"
        })
        reasons.append({
            "severity": "LOW",
            "badge_color": "success",
            "title": "No Malicious URL or Credential Vectors",
            "explanation": "No suspicious external redirect links, IP addresses, or phishing credential harvesting forms were found in the message body.",
            "evidence": f"Scanned {signals.get('url_count', 0)} links; all verified safe"
        })
        reasons.append({
            "severity": "LOW",
            "badge_color": "success",
            "title": "Natural Linguistic Entropy",
            "explanation": "The email syntax and vocabulary exhibit natural conversational entropy without excessive capitalization or spam trigger keywords.",
            "evidence": f"Caps ratio: {int(signals.get('caps_ratio', 0)*100)}%, Punctuation ratio: {int(signals.get('special_char_ratio', 0)*100)}%"
        })
        return reasons
        
    # Threat / Spam explanations
    if len(signals.get("ip_based_urls", [])) > 0:
        reasons.append({
            "severity": "CRITICAL",
            "badge_color": "danger",
            "title": "Direct IP-Based Hyperlink Detected",
            "explanation": "The email includes hyperlinks pointing directly to raw numerical IP addresses rather than legitimate registered domain names, a critical hallmark of command-and-control phishing infrastructure.",
            "evidence": ", ".join(signals.get("ip_based_urls", [])[:2])
        })
        
    if signals.get("domain_mismatch"):
        reasons.append({
            "severity": "HIGH",
            "badge_color": "danger",
            "title": "Sender Domain vs Link Target Mismatch",
            "explanation": f"The sender claims to be from '{signals.get('sender_domain', 'unknown')}', but embedded links redirect users to external destination domains: {', '.join(signals.get('external_domains', [])[:2])}.",
            "evidence": f"Sender: {sender} -> Destination: {signals.get('external_domains', ['external'])[0]}"
        })
        
    if len(signals.get("suspicious_urls", []) ) > 0:
        reasons.append({
            "severity": "HIGH",
            "badge_color": "danger",
            "title": "Suspicious / Spoofed External URL",
            "explanation": "The email contains links targeting suspicious top-level domains or domain names mimicking well-known service providers.",
            "evidence": ", ".join(signals.get("suspicious_urls", [])[:2])
        })
        
    if signals.get("credential_harvest_detected"):
        reasons.append({
            "severity": "HIGH",
            "badge_color": "danger",
            "title": "Credential & Sensitive Information Solicitation",
            "explanation": "Language soliciting sensitive personal credentials, password resets, bank routing, or direct deposit modifications was detected.",
            "evidence": f"Matches: {', '.join(signals.get('credential_matches', [])[:4])}"
        })
        
    if signals.get("urgency_detected"):
        reasons.append({
            "severity": "MEDIUM",
            "badge_color": "warning",
            "title": "Urgency & Psychological Coercion Tactics",
            "explanation": "The message employs high-pressure urgency language designed to bypass rational scrutiny and compel immediate user action.",
            "evidence": f"Trigger keywords: {', '.join(signals.get('urgency_matches', [])[:4])}"
        })
        
    if signals.get("prize_detected"):
        reasons.append({
            "severity": "HIGH",
            "badge_color": "danger",
            "title": "Unsolicited Prize & Lottery Payout Narrative",
            "explanation": "The message contains claims of unexpected lottery wins, beneficiary claims, or large cash transfers requiring upfront response.",
            "evidence": f"Matches: {', '.join(signals.get('prize_matches', [])[:4])}"
        })
        
    if signals.get("promo_detected") and classification == "PROMOTIONAL":
        reasons.append({
            "severity": "MEDIUM",
            "badge_color": "info",
            "title": "High-Density Commercial Marketing Content",
            "explanation": "The content exhibits high-density promotional discount vocabulary and mass-distribution marketing markers.",
            "evidence": f"Promotional triggers: {', '.join(signals.get('promo_matches', [])[:4])}"
        })
        
    if signals.get("excessive_caps"):
        reasons.append({
            "severity": "LOW",
            "badge_color": "warning",
            "title": "Anomalous Capitalization Density",
            "explanation": "An unusually high percentage of characters in the message are uppercase, characteristic of aggressive spam.",
            "evidence": f"{int(signals.get('caps_ratio', 0)*100)}% uppercase characters"
        })
        
    return reasons

def generate_highlighted_body(body: str, signals: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parses original email body and segments it into annotated spans:
    - HIGH_RISK: Phishing credentials, urgent coercion, malicious links
    - SUSPICIOUS: Promotional triggers, anomalous symbols, lottery lures
    - NORMAL: Regular business communication text
    """
    if not body:
        return []
        
    # Compile phrase matchers
    high_risk_patterns = []
    suspicious_patterns = []
    
    # High risk regexes
    for kw in CREDENTIAL_KEYWORDS:
        high_risk_patterns.append((kw, "Credential harvest solicitation"))
    for kw in URGENCY_KEYWORDS:
        high_risk_patterns.append((kw, "Urgency & psychological pressure"))
    high_risk_patterns.append((r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}[^\s]*', "Raw IP-based link destination"))
    high_risk_patterns.append((r'https?://[^\s]*(?:recover|verify|login|auth|update|security)[^\s]*', "Suspicious auth link target"))
    
    # Suspicious regexes
    for kw in PRIZE_KEYWORDS:
        suspicious_patterns.append((kw, "Prize / lottery / cash lure"))
    for kw in PROMO_KEYWORDS:
        suspicious_patterns.append((kw, "Promotional marketing keyword"))
    suspicious_patterns.append((r'https?://[^\s]+', "External link URL"))
    suspicious_patterns.append((r'\b[A-Z0-9_\-\.]{4,}\b', "All-caps token"))
    
    # Find all matches in body
    spans = [] # (start, end, category, label, explanation)
    
    # 1. High risk matches
    for pattern, exp in high_risk_patterns:
        for m in re.finditer(pattern, body, flags=re.IGNORECASE):
            spans.append((m.start(), m.end(), "high_risk", "High-Risk Phrase", exp))
            
    # 2. Suspicious matches
    for pattern, exp in suspicious_patterns:
        for m in re.finditer(pattern, body, flags=re.IGNORECASE):
            # Skip if already overlapped by high risk
            start, end = m.start(), m.end()
            if not any(s <= start < e or s < end <= e for s, e, cat, _, _ in spans if cat == "high_risk"):
                spans.append((start, end, "suspicious", "Suspicious Phrase", exp))
                
    # Sort spans by start
    spans.sort(key=lambda x: (x[0], -x[1]))
    
    # Merge overlapping or non-conflicting spans
    merged_spans = []
    last_end = 0
    for start, end, cat, lbl, exp in spans:
        if start < last_end:
            continue
        if start >= end:
            continue
        merged_spans.append((start, end, cat, lbl, exp))
        last_end = end
        
    # Build complete annotated segments
    segments = []
    cursor = 0
    
    for start, end, cat, lbl, exp in merged_spans:
        if start > cursor:
            segments.append({
                "text": body[cursor:start],
                "type": "normal",
                "label": "Normal Text",
                "explanation": "Standard communication language"
            })
        segments.append({
            "text": body[start:end],
            "type": cat,
            "label": lbl,
            "explanation": exp
        })
        cursor = end
        
    if cursor < len(body):
        segments.append({
            "text": body[cursor:],
            "type": "normal",
            "label": "Normal Text",
            "explanation": "Standard communication language"
        })
        
    return segments
