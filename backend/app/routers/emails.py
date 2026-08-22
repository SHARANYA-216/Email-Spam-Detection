"""
MailGuard AI - Email Analysis & Management Router
Handles email classification, .eml/.txt file parsing, explainability generation,
history retrieval, and feedback submission.
"""

import json
import email
from email import policy
from email.parser import BytesParser
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.app.database import get_db
from backend.app.models import EmailRecord, PredictionRecord, FeedbackRecord, User
from backend.app.auth import get_current_user
from backend.app.schemas import (
    EmailAnalyzeRequest,
    PredictionResponse,
    FeedbackCreateRequest,
    FeedbackResponse,
    PaginatedThreatsResponse,
    RecentThreatItem
)
from backend.app.ml.classifier import classify_email
from backend.app.ml.risk_scorer import compute_risk_score
from backend.app.ml.explainability import generate_xai_explanations, generate_highlighted_body

router = APIRouter(prefix="/emails", tags=["Emails"])

def _execute_analysis_and_store(sender: str, subject: str, body: str, file_type: str, db: Session, user: Optional[User] = None):
    sender = (sender or "").strip() or "unknown-sender@external-domain.net"
    subject = (subject or "").strip()
    body = (body or "").strip()

    # Accept subject-only, body-only, or both. Reject only when both are empty.
    if not subject and not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter an email subject or body before analyzing."
        )
        
    # 1. Run ML classification & structural signal analysis
    clf_res = classify_email(sender, subject, body)
    
    # 2. Derive calibrated multi-signal risk score
    risk_res = compute_risk_score(clf_res)
    
    # 3. Generate dynamic XAI explanations & highlight spans
    explanations = generate_xai_explanations(sender, subject, body, clf_res, risk_res)
    highlight_spans = generate_highlighted_body(body, clf_res.get("signals", {}))
    
    # 4. Persist to Database
    email_rec = EmailRecord(
        user_id=user.id if user else None,
        sender=sender,
        subject=subject,
        body=body,
        file_type=file_type
    )
    db.add(email_rec)
    db.flush()
    
    pred_rec = PredictionRecord(
        email_id=email_rec.id,
        is_spam=clf_res["is_spam"],
        classification=clf_res["classification"],
        category=clf_res["category"],
        risk_score=risk_res["risk_score"],
        risk_level=risk_res["risk_level"],
        confidence=clf_res["confidence"],
        spam_probability=clf_res["spam_probability"],
        ham_probability=clf_res["ham_probability"],
        signals_json=json.dumps(clf_res["signals"]),
        explanations_json=json.dumps(explanations),
        highlight_spans_json=json.dumps(highlight_spans),
        model_version="v1.2.0-svm-prod"
    )
    db.add(pred_rec)
    db.commit()
    db.refresh(email_rec)
    db.refresh(pred_rec)
    
    return {
        "id": pred_rec.id,
        "email_id": email_rec.id,
        "sender": sender,
        "subject": subject,
        "body": body,
        "is_spam": clf_res["is_spam"],
        "classification": clf_res["classification"],
        "category": clf_res["category"],
        "risk_score": risk_res["risk_score"],
        "risk_level": risk_res["risk_level"],
        "confidence": clf_res["confidence"],
        "spam_probability": clf_res["spam_probability"],
        "ham_probability": clf_res["ham_probability"],
        "model_version": pred_rec.model_version,
        "created_at": pred_rec.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "signals": clf_res["signals"],
        "risk_breakdown": risk_res["risk_breakdown"],
        "explanations": explanations,
        "highlight_spans": highlight_spans
    }

@router.post("/analyze", response_model=PredictionResponse)
def analyze_email(req: EmailAnalyzeRequest, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user)):
    return _execute_analysis_and_store(
        sender=req.sender,
        subject=req.subject,
        body=req.body,
        file_type="manual/text",
        db=db,
        user=user
    )

@router.post("/upload", response_model=PredictionResponse)
async def upload_email_file(file: UploadFile = File(...), db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user)):
    filename = file.filename.lower() if file.filename else ""
    if not (filename.endswith(".eml") or filename.endswith(".txt") or filename.endswith(".msg")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a valid .eml or .txt email file."
        )
        
    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded email file is empty. Please select a valid file."
        )
        
    sender = "security-upload@enterprise-scan.org"
    subject = "Uploaded Email Inspection"
    body = ""
    
    if filename.endswith(".eml"):
        try:
            msg = BytesParser(policy=policy.default).parsebytes(content_bytes)
            sender = msg.get("from", sender)
            subject = msg.get("subject", subject)
            
            # Extract body
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        body += part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore') + "\n"
            else:
                body = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corrupt or unreadable .eml file structure: {str(e)}"
            )
    else:
        # .txt file
        try:
            raw_text = content_bytes.decode('utf-8', errors='ignore')
            lines = raw_text.splitlines()
            body_lines = []
            for line in lines:
                if line.lower().startswith("from:") and not sender:
                    sender = line[5:].strip()
                elif line.lower().startswith("subject:") and subject == "Uploaded Email Inspection":
                    subject = line[8:].strip()
                else:
                    body_lines.append(line)
            body = "\n".join(body_lines).strip()
            if not body:
                body = raw_text
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to read text file: {str(e)}"
            )
            
    return _execute_analysis_and_store(
        sender=sender,
        subject=subject,
        body=body,
        file_type="file/eml" if filename.endswith(".eml") else "file/txt",
        db=db,
        user=user
    )

@router.get("/history")
def get_email_history(
    search: Optional[str] = Query(None),
    classification: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(EmailRecord, PredictionRecord).join(PredictionRecord, EmailRecord.id == PredictionRecord.email_id)
    
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EmailRecord.sender.ilike(search_pattern),
                EmailRecord.subject.ilike(search_pattern),
                PredictionRecord.category.ilike(search_pattern)
            )
        )
        
    if classification and classification != "ALL":
        query = query.filter(PredictionRecord.classification == classification)
        
    if risk_level and risk_level != "ALL":
        query = query.filter(PredictionRecord.risk_level == risk_level)
        
    total_count = query.count()
    records = query.order_by(desc(PredictionRecord.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for email_rec, pred_rec in records:
        # Check if feedback exists
        fb = db.query(FeedbackRecord).filter(FeedbackRecord.email_id == email_rec.id).first()
        items.append({
            "id": email_rec.id,
            "prediction_id": pred_rec.id,
            "sender": email_rec.sender,
            "subject": email_rec.subject,
            "classification": pred_rec.classification,
            "category": pred_rec.category,
            "risk_score": pred_rec.risk_score,
            "risk_level": pred_rec.risk_level,
            "confidence": pred_rec.confidence,
            "is_spam": pred_rec.is_spam,
            "created_at": pred_rec.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "feedback": {
                "is_correct": fb.is_correct if fb else None,
                "user_correction": fb.user_correction if fb else None
            } if fb else None
        })
        
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/{id}")
def get_email_detail(id: int, db: Session = Depends(get_db)):
    email_rec = db.query(EmailRecord).filter(EmailRecord.id == id).first()
    if not email_rec:
        raise HTTPException(status_code=404, detail="Email record not found.")
        
    pred_rec = db.query(PredictionRecord).filter(PredictionRecord.email_id == id).first()
    if not pred_rec:
        raise HTTPException(status_code=404, detail="Prediction record for email not found.")
        
    fb_rec = db.query(FeedbackRecord).filter(FeedbackRecord.email_id == id).first()
    
    signals = json.loads(pred_rec.signals_json) if pred_rec.signals_json else {}
    explanations = json.loads(pred_rec.explanations_json) if pred_rec.explanations_json else []
    highlight_spans = json.loads(pred_rec.highlight_spans_json) if pred_rec.highlight_spans_json else []
    
    # Recompute risk breakdown
    risk_res = compute_risk_score({
        "spam_probability": pred_rec.spam_probability,
        "signals": signals,
        "classification": pred_rec.classification
    })
    
    return {
        "id": pred_rec.id,
        "email_id": email_rec.id,
        "sender": email_rec.sender,
        "subject": email_rec.subject,
        "body": email_rec.body,
        "is_spam": pred_rec.is_spam,
        "classification": pred_rec.classification,
        "category": pred_rec.category,
        "risk_score": pred_rec.risk_score,
        "risk_level": pred_rec.risk_level,
        "confidence": pred_rec.confidence,
        "spam_probability": pred_rec.spam_probability,
        "ham_probability": pred_rec.ham_probability,
        "model_version": pred_rec.model_version,
        "created_at": pred_rec.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "signals": signals,
        "risk_breakdown": risk_res.get("risk_breakdown", []),
        "explanations": explanations,
        "highlight_spans": highlight_spans,
        "feedback": {
            "id": fb_rec.id,
            "is_correct": fb_rec.is_correct,
            "user_correction": fb_rec.user_correction,
            "comment": fb_rec.comment,
            "status": fb_rec.status
        } if fb_rec else None
    }

@router.post("/{id}/feedback", response_model=FeedbackResponse)
def submit_feedback(id: int, req: FeedbackCreateRequest, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user)):
    email_rec = db.query(EmailRecord).filter(EmailRecord.id == id).first()
    if not email_rec:
        raise HTTPException(status_code=404, detail="Email record not found.")
        
    pred_rec = db.query(PredictionRecord).filter(PredictionRecord.email_id == id).first()
    
    # Check if feedback already recorded
    existing_fb = db.query(FeedbackRecord).filter(FeedbackRecord.email_id == id).first()
    if existing_fb:
        existing_fb.is_correct = req.is_correct
        existing_fb.user_correction = req.user_correction
        existing_fb.comment = req.comment
        db.commit()
        db.refresh(existing_fb)
        return {
            "id": existing_fb.id,
            "email_id": email_rec.id,
            "prediction_id": pred_rec.id if pred_rec else None,
            "is_correct": existing_fb.is_correct,
            "user_correction": existing_fb.user_correction,
            "status": existing_fb.status,
            "created_at": existing_fb.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "message": "Feedback successfully updated. It will be incorporated in the next continuous learning cycle."
        }
        
    fb_rec = FeedbackRecord(
        email_id=email_rec.id,
        prediction_id=pred_rec.id if pred_rec else None,
        user_id=user.id if user else None,
        is_correct=req.is_correct,
        user_correction=req.user_correction,
        comment=req.comment,
        status="APPROVED",
        model_version=pred_rec.model_version if pred_rec else "v1.2.0-svm-prod"
    )
    db.add(fb_rec)
    db.commit()
    db.refresh(fb_rec)
    
    return {
        "id": fb_rec.id,
        "email_id": email_rec.id,
        "prediction_id": pred_rec.id if pred_rec else None,
        "is_correct": fb_rec.is_correct,
        "user_correction": fb_rec.user_correction,
        "status": fb_rec.status,
        "created_at": fb_rec.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "message": "Feedback recorded! Thank you for improving MailGuard AI's detection models."
    }
