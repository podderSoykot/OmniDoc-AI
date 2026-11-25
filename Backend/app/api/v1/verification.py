from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import Document, CrossVerification
from app.models.schemas import CrossVerifyRequest, CrossVerifyResponse
from app.services.cross_verification.verifier import CrossVerificationOrchestrator
from app.services.ingestion.excel_parser import ExcelParser

router = APIRouter(prefix="/verification", tags=["Cross Verification"])

@router.post("/cross-check", response_model=CrossVerifyResponse)
def run_cross_verification(req: CrossVerifyRequest, db: Session = Depends(get_db)):
    src_doc = db.query(Document).filter(Document.id == req.source_document_id).first()
    tgt_doc = db.query(Document).filter(Document.id == req.target_document_id).first()

    if not src_doc or not tgt_doc:
        raise HTTPException(status_code=404, detail="One or both documents not found")

    src_data = src_doc.extraction.structured_data if src_doc.extraction else {}
    tgt_data = tgt_doc.extraction.structured_data if tgt_doc.extraction else {}

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
        target_sheets=tgt_sheets
    )

    # Persist verification result
    rec = CrossVerification(
        id=result.id,
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
