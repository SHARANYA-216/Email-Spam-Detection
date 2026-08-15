import re

HIGH_RISK_PATTERNS = [
    (r'\b(won|winner|cash prize|sweepstakes|₹10,00,000|\$50,00,000|\$5,000|lottery)\b', "Prize/reward language associated with spam & scams"),
    (r'\b(verify your identity|account has been suspended|unauthorized login|reset your password|locked|suspended|reactivate your account)\b', "Credential harvesting & phishing threat pattern"),
    (r'\b(bank account|routing number|ssn|credit card|cvv|secret recovery phrase|seed phrase)\b', "Sensitive financial credential request"),
    (r'\b(transfer a small processing fee|guaranteed returns|multiply your savings|secret trading algorithm)\b', "Financial fraud / advance fee scam signal")
]

SUSPICIOUS_PATTERNS = [
    (r'\b(urgent|immediate|act now|within 24 hours|expire today|final notice|quota exceeded)\b', "High urgency pressure tactic"),
    (r'\b(click here|click the link|log into your|claim reward|unusual activity)\b', "Call-to-action link solicitation"),
    (r'\b(80% off|sale|coupon code|cashback|free shipping|discount|limited time offer)\b', "Promotional marketing keyword")
]

def extract_explainability_signals(sender, subject, body, risk_data, vectorizer, model):
    text = (subject + " " + body).lower()
    urls = re.findall(r'https?://[^\s]+', body)
    reasons = []

    # 1. Domain Indicator Signal
    sender_domain = sender.split("@")[-1] if "@" in sender else sender
    known_brands = ["paypal", "google", "microsoft", "apple", "bankofamerica", "netflix", "amazon", "github", "aws"]
    matched_brand = next((b for b in known_brands if b in sender_domain.lower()), None)
    if matched_brand and not sender_domain.lower().endswith(f"{matched_brand}.com"):
        reasons.append({
            "severity": "CRITICAL",
            "badge": "🔴 Lookalike Sender Domain",
            "title": "Lookalike Sender Domain Detected",
            "explanation": f"Sender domain '{sender_domain}' imitates legitimate brand '{matched_brand}' using substituted domain suffixes.",
            "evidence": f"Sender: {sender}"
        })

    # 2. URL Signals
    if len(urls) > 0:
        insecure_urls = [u for u in urls if u.startswith("http://")]
        if insecure_urls:
            reasons.append({
                "severity": "HIGH",
                "badge": "🔴 Insecure / Unencrypted Links",
                "title": "Insecure HTTP URL Detected",
                "explanation": "The email contains unencrypted HTTP links that increase susceptibility to man-in-the-middle credential interception.",
                "evidence": f"URL: {insecure_urls[0]}"
            })
        if len(urls) >= 2:
            reasons.append({
                "severity": "MEDIUM",
                "badge": "🟠 Multiple External Links",
                "title": "Multiple External Redirection Links",
                "explanation": f"The email body contains {len(urls)} external links diverting users to third-party domains.",
                "evidence": f"Found {len(urls)} links"
            })

    # 3. Urgency Signal
    urgency_matches = [kw for kw in ["urgent", "immediate", "suspended", "verify your identity", "within 24 hours"] if kw in text]
    if urgency_matches:
        reasons.append({
            "severity": "HIGH",
            "badge": "🔴 Urgency-Based Language",
            "title": "Urgent Action Coercion",
            "explanation": "The message employs coercive, urgent language threatening account loss to induce immediate user compliance.",
            "evidence": f"Keywords: {', '.join(urgency_matches)}"
        })

    # 4. Reward / Prize Signal
    prize_matches = [kw for kw in ["won", "cash prize", "lottery", "₹10,00,000", "$5,000", "guaranteed"] if kw in text]
    if prize_matches:
        reasons.append({
            "severity": "HIGH",
            "badge": "🔴 Prize / Financial Reward Language",
            "title": "Unrealistic Financial Incentive",
            "explanation": "The email promises unsolicited high-value prizes or guaranteed returns frequently seen in advance-fee spam schemes.",
            "evidence": f"Keywords: {', '.join(prize_matches)}"
        })

    # 5. Sensitive Credential Signal
    cred_matches = [kw for kw in ["password", "ssn", "credit card", "bank account", "seed phrase"] if kw in text]
    if cred_matches:
        reasons.append({
            "severity": "CRITICAL",
            "badge": "🔴 Sensitive Credential Request",
            "title": "Direct Credential / PII Harvester",
            "explanation": "The message solicits highly confidential credentials or personal financial identifiers.",
            "evidence": f"Keywords: {', '.join(cred_matches)}"
        })

    # Fallback for legitimate email if no high-risk signals triggered
    if not reasons and risk_data["risk_score"] < 35:
        reasons.append({
            "severity": "LOW",
            "badge": "🟢 Legitimate Communication",
            "title": "Verified Low-Risk Email Structure",
            "explanation": "No suspicious URLs, domain spoofing, urgency coercion, or credential harvesting patterns were detected.",
            "evidence": "Standard conversational / workplace email structure."
        })

    # Top Feature Words from TF-IDF Vectorizer
    top_words = []
    try:
        feature_names = vectorizer.get_feature_names_out()
        tfidf_vec = vectorizer.transform([(subject + " " + body).lower()])
        non_zero_indices = tfidf_vec.nonzero()[1]
        word_scores = [(feature_names[i], float(tfidf_vec[0, i])) for i in non_zero_indices]
        word_scores.sort(key=lambda x: x[1], reverse=True)
        top_words = word_scores[:6]
    except Exception:
        top_words = []

    return {
        "reasons": reasons,
        "top_word_weights": top_words
    }

def get_highlighted_phrases(body):
    """
    Parses body text and flags high-risk, suspicious, and normal phrase segments for UI highlighting.
    """
    phrases = []
    text = body
    
    # We scan for matches and build annotated spans
    matched_spans = []
    
    for pattern, reason in HIGH_RISK_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            matched_spans.append((match.start(), match.end(), match.group(), "HIGH", reason))
            
    for pattern, reason in SUSPICIOUS_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            # check overlap
            if not any(s <= match.start() < e or s < match.end() <= e for s, e, _, _, _ in matched_spans):
                matched_spans.append((match.start(), match.end(), match.group(), "MEDIUM", reason))
                
    matched_spans.sort(key=lambda x: x[0])

    last_idx = 0
    highlight_chunks = []
    
    for start, end, chunk_text, risk_type, reason in matched_spans:
        if start > last_idx:
            highlight_chunks.append({
                "text": text[last_idx:start],
                "type": "NORMAL",
                "reason": ""
            })
        highlight_chunks.append({
            "text": chunk_text,
            "type": risk_type,  # HIGH or MEDIUM
            "reason": reason
        })
        last_idx = end
        
    if last_idx < len(text):
        highlight_chunks.append({
            "text": text[last_idx:],
            "type": "NORMAL",
            "reason": ""
        })

    return highlight_chunks if highlight_chunks else [{"text": body, "type": "NORMAL", "reason": ""}]
