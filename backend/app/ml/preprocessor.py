"""
MailGuard AI - NLP Preprocessor & Feature Extraction
Handles text normalization, URL inspection, heuristic signal detection,
and TF-IDF input preparation.
"""

import re
import html
import urllib.parse
from typing import Dict, List, Any, Tuple

# Suspicious keyword dictionaries
URGENCY_KEYWORDS = [
    r"\burgent\b", r"\bimmediate(ly)?\b", r"\baction required\b", r"\baccount suspended\b",
    r"\bexpire(s|d)?\b", r"\bwithin \d+ hours\b", r"\bdeactivat(e|ed|ion)\b",
    r"\bverify your\b", r"\brestricted\b", r"\bunauthorized\b", r"\bcritical alert\b"
]

PRIZE_KEYWORDS = [
    r"\bwon\b", r"\bwinner\b", r"\blottery\b", r"\bprize\b", r"\bcongratulations\b",
    r"\bmillion (dollars|usd)\b", r"\bclaim your\b", r"\bbeneficiary\b",
    r"\bfree gift\b", r"\bguaranteed\b", r"\bcash prize\b", r"\binheritance\b"
]

CREDENTIAL_KEYWORDS = [
    r"\bpassword\b", r"\blogin\b", r"\bcredential(s)?\b", r"\bssn\b",
    r"\bcredit card\b", r"\bsecurity question\b", r"\bpin number\b",
    r"\botp\b", r"\bpasscode\b", r"\bbank account\b", r"\brouting number\b"
]

PROMO_KEYWORDS = [
    r"\bdiscount\b", r"\b% off\b", r"\bflash sale\b", r"\bexclusive deal\b",
    r"\blimited time offer\b", r"\bpromo code\b", r"\bbuy now\b", r"\bunsubscribe\b",
    r"\bfree trial\b", r"\bvoucher\b", r"\bspecial invitation\b"
]

def clean_text(text: str) -> str:
    """Cleans and standardizes raw text."""
    if not text:
        return ""
    # Unescape HTML
    text = html.unescape(text)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_urls(text: str) -> List[str]:
    """Extracts all URLs from the text."""
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*\??[/\w\.-=&%]*'
    return re.findall(url_pattern, text)

def analyze_signals(sender: str, subject: str, body: str) -> Dict[str, Any]:
    """
    Extracts deep structural and heuristic threat signals from the email.
    """
    combined_text = f"{subject}\n{body}"
    urls = extract_urls(combined_text)
    
    # 1. URL Analysis
    suspicious_urls = []
    ip_based_urls = []
    external_domains = set()
    sender_domain = ""
    
    if sender and "@" in sender:
        sender_domain = sender.split("@")[-1].strip().lower()
        
    for u in urls:
        try:
            parsed = urllib.parse.urlparse(u)
            netloc = parsed.netloc.lower()
            external_domains.add(netloc)
            
            # Check if domain uses raw IP address
            if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", netloc):
                ip_based_urls.append(u)
                suspicious_urls.append(u)
            # Suspicious TLDs or keyword-stuffed hostnames
            elif any(tld in netloc for tld in [".xyz", ".top", ".cc", ".online", ".info", ".buzz", ".work", ".tk"]):
                suspicious_urls.append(u)
            elif any(brand in netloc and sender_domain and brand not in sender_domain for brand in ["microsoft", "google", "paypal", "apple", "netflix", "bank", "secure"]):
                suspicious_urls.append(u)
        except Exception:
            pass
            
    # Domain Mismatch
    domain_mismatch = False
    if sender_domain and external_domains:
        # Check if external domains don't match sender domain
        mismatches = [d for d in external_domains if sender_domain not in d and d not in sender_domain]
        if len(mismatches) > 0 and not any(whitelisted in d for whitelisted in ["google.com", "microsoft.com", "github.com", "linkedin.com"] for d in mismatches):
            domain_mismatch = True

    # 2. Linguistic Signal Detection
    body_lower = combined_text.lower()
    
    urgency_matches = [m.group() for r in URGENCY_KEYWORDS for m in re.finditer(r, body_lower)]
    prize_matches = [m.group() for r in PRIZE_KEYWORDS for m in re.finditer(r, body_lower)]
    credential_matches = [m.group() for r in CREDENTIAL_KEYWORDS for m in re.finditer(r, body_lower)]
    promo_matches = [m.group() for r in PROMO_KEYWORDS for m in re.finditer(r, body_lower)]
    
    # 3. Structural & Typographic signals
    total_chars = len(body) if body else 1
    uppercase_chars = sum(1 for c in body if c.isupper())
    caps_ratio = uppercase_chars / max(total_chars, 1)
    
    special_char_count = sum(1 for c in body if c in "!@#$%^&*()_+{}[]:;\"'<>?,.")
    special_char_ratio = special_char_count / max(total_chars, 1)
    
    has_attachment_spoof = bool(re.search(r"\b(attached|attachment|invoice_pdf|payment_receipt)\b", body_lower))
    
    return {
        "url_count": len(urls),
        "urls": urls,
        "suspicious_urls": suspicious_urls,
        "ip_based_urls": ip_based_urls,
        "external_domains": list(external_domains),
        "domain_mismatch": domain_mismatch,
        "sender_domain": sender_domain,
        "urgency_detected": len(urgency_matches) > 0,
        "urgency_matches": list(set(urgency_matches)),
        "prize_detected": len(prize_matches) > 0,
        "prize_matches": list(set(prize_matches)),
        "credential_harvest_detected": len(credential_matches) > 0,
        "credential_matches": list(set(credential_matches)),
        "promo_detected": len(promo_matches) > 0,
        "promo_matches": list(set(promo_matches)),
        "caps_ratio": round(caps_ratio, 3),
        "excessive_caps": caps_ratio > 0.28,
        "special_char_ratio": round(special_char_ratio, 3),
        "excessive_special_chars": special_char_ratio > 0.12,
        "has_attachment_spoof": has_attachment_spoof
    }

def prepare_text_for_model(subject: str, body: str) -> str:
    """Prepares combined subject and body for TF-IDF vectorization."""
    clean_sub = clean_text(subject)
    clean_bod = clean_text(body)
    return f"{clean_sub} {clean_bod}"
