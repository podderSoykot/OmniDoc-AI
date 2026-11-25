from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import Document, CrossVerification, User
from app.models.schemas import CrossVerifyRequest, CrossVerifyResponse
from app.services.cross_verification.verifier import CrossVerificationOrchestrator
from app.services.ingestion.excel_parser import ExcelParser
from app.core.auth import get_current_user

router = APIRouter(prefix="/verification", tags=["Cross Verification"])

@router.post("/cross-check", response_model=CrossVerifyResponse)
def run_cross_verification(
    req: CrossVerifyRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    src_doc = db.query(Document).filter(Document.id == req.source_document_id, Document.user_id == current_user.id).first()
    tgt_doc = db.query(Document).filter(Document.id == req.target_document_id, Document.user_id == current_user.id).first()

    if not src_doc or not tgt_doc:
        raise HTTPException(status_code=404, detail="One or both documents not found or access denied")

    src_data = src_doc.extraction.structured_data if src_doc.extraction else {}
    tgt_data = tgt_doc.extraction.structured_data if tgt_doc.extraction else {}

    src_sheets = None
    if src_doc.file_type in ("excel", "csv"):
        parsed = ExcelParser.parse_spreadsheet(Path(src_doc.file_path))
        src_sheets = parsed.get("sheets")

    tgt_sheets = None
    if tgt_doc.file_type in ("excel", "csv"):
        parsed = ExcelParser.parse_spreadsheet(Path(tgt_doc.file_path))
        tgt_sheets = parsed.get("sheets")

    result = CrossVerificationOrchestrator.cross_verify(
        source_doc_id=src_doc.id,
        target_doc_id=tgt_doc.id,
        source_type=src_doc.file_type,
        target_type=tgt_doc.file_type,
        source_data=src_data,
        target_data=tgt_data,
        target_sheets=tgt_sheets,
        source_sheets=src_sheets
    )

    # Persist verification result
    rec = CrossVerification(
        id=result.id,
        user_id=current_user.id if current_user else None,
        source_doc_id=result.source_doc_id,
        target_doc_id=result.target_doc_id,
        verification_type=result.verification_type,
        match_score=result.match_score,
        status=result.status,
        discrepancies=[d.model_dump() for d in result.discrepancies],
        summary=result.summary
    )
    db.add(rec)
    db.commit()

    return result

@router.get("/history")
def get_verification_history(
    limit: int = 20, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CrossVerification).filter(CrossVerification.user_id == current_user.id)

    records = (
        query
        .order_by(CrossVerification.created_at.desc())
        .limit(limit)
        .all()
    )
    results = []
    for r in records:
        src = db.query(Document).filter(Document.id == r.source_doc_id).first()
        tgt = db.query(Document).filter(Document.id == r.target_doc_id).first()
        results.append({
            "id": r.id,
            "source_doc_id": r.source_doc_id,
            "target_doc_id": r.target_doc_id,
            "source_filename": src.filename if src else "Unknown Source",
            "target_filename": tgt.filename if tgt else "Unknown Target",
            "verification_type": r.verification_type,
            "match_score": r.match_score,
            "status": r.status,
            "discrepancies": r.discrepancies,
            "summary": r.summary,
            "created_at": r.created_at.isoformat()
        })
    return results
