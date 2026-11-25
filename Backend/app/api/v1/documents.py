import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.logging_config import logger
from app.models.document import Document, DocumentExtraction, ValidationResult, AuditLog, CrossVerification, User
from app.models.schemas import (
    DocumentDetailResponse, DocumentListItemResponse,
    ValidationReport, ManualCorrectionRequest, InvoiceExtractionSchema
)
from app.services.queue.job_manager import JobManager
from app.services.validation.validator import DocumentValidator
from app.core.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts multiple documents (PDF, JPG, PNG, TIFF, XLSX, XLS, CSV).
    Saves files and queues background processing jobs.
    Strictly isolated per authenticated user.
    """
    enqueued_jobs = []

    for file in files:
        doc_id = str(uuid.uuid4())
        job_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix.lower()
        saved_filename = f"{doc_id}{file_ext}"
        saved_path = settings.UPLOAD_DIR / saved_filename

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = saved_path.stat().st_size
        new_doc = Document(
            id=doc_id,
            user_id=current_user.id,
            filename=file.filename,
            file_path=str(saved_path),
            file_type="unknown",
            file_size_bytes=file_size,
            status="pending"
        )
        db.add(new_doc)
        db.commit()

        # Initialize and queue job
        JobManager.create_job(job_id, doc_id)
        background_tasks.add_task(JobManager.process_document_job, job_id, doc_id, str(saved_path))

        enqueued_jobs.append({
            "document_id": doc_id,
            "job_id": job_id,
            "filename": file.filename
        })

    return {"uploaded_count": len(enqueued_jobs), "jobs": enqueued_jobs}

@router.get("", response_model=List[DocumentListItemResponse])
def list_documents(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    
    docs = query.order_by(Document.created_at.desc()).limit(limit).offset(offset).all()
    results = []
    for d in docs:
        struct = d.extraction.structured_data if d.extraction else {}
        rev_status = d.validation.review_status if d.validation else "PENDING"

        # Calculate Grand Total (for invoices and spreadsheets)
        total_val = None
        if struct:
            if struct.get("total") is not None:
                try:
                    total_val = float(struct.get("total"))
                except (ValueError, TypeError):
                    pass
            elif struct.get("primary_metrics"):
                p_metrics = struct.get("primary_metrics", {})
                for k in ("Invoice_Register::GrandTotal", "Invoice_Register::Total", "Sheet1::Amount"):
                    if k in p_metrics:
                        total_val = float(p_metrics[k])
                        break
                if total_val is None:
                    for k, v in p_metrics.items():
                        if any(term in k.lower() for term in ("grandtotal", "totalamount", "total")):
                            try:
                                total_val = float(v)
                                break
                            except (ValueError, TypeError):
                                pass

        supplier = struct.get("supplier_name") if struct else None
        if not supplier and d.file_type in ("excel", "csv"):
            if struct and struct.get("total_sheets"):
                supplier = f"{struct.get('total_sheets')} Sheets ({struct.get('total_records', 0):,} records)"
            else:
                supplier = "Multi-Sheet Ledger"

        results.append(DocumentListItemResponse(
            id=d.id,
            filename=d.filename,
            file_type=d.file_type,
            file_size_bytes=d.file_size_bytes,
            page_count=d.page_count,
            status=d.status,
            review_status=rev_status,
            total=total_val,
            currency=struct.get("currency") if struct else "USD",
            supplier_name=supplier,
            created_at=d.created_at
        ))
    return results

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    val_report = None
    if doc.validation:
        val_report = ValidationReport(
            is_valid=doc.validation.is_valid,
            review_status=doc.validation.review_status,
            math_errors=doc.validation.math_errors or [],
            business_errors=doc.validation.business_errors or [],
            warnings=doc.validation.warnings or []
        )

    # Resolve spreadsheet sheets if applicable
    is_spreadsheet = doc.file_type in ("excel", "csv")
    sheets_data = None
    if doc.extraction and doc.extraction.structured_data:
        sheets_data = doc.extraction.structured_data.get("sheets")
        if doc.extraction.structured_data.get("is_spreadsheet"):
            is_spreadsheet = True

    # If spreadsheet needs migration or has not persisted sheets/summaries yet
    needs_refresh = (
        is_spreadsheet and (
            not sheets_data or 
            doc.extraction.structured_data.get("invoice_number") == "_Register" or
            "sheet_summaries" not in (doc.extraction.structured_data or {})
        )
    )

    if needs_refresh and Path(doc.file_path).exists():
        try:
            from app.services.ingestion.excel_parser import ExcelParser
            parsed = ExcelParser.parse_spreadsheet(Path(doc.file_path))
            sheets_data = parsed.get("sheets")
            summary = ExcelParser.summarize_spreadsheet(sheets_data or {})
            
            clean_struct = {
                "document_type": "spreadsheet_ledger",
                "is_spreadsheet": True,
                "total_records": summary["total_records"],
                "total_sheets": summary["total_sheets"],
                "sheet_summaries": summary["sheet_summaries"],
                "primary_metrics": summary["primary_metrics"],
                "sheets": sheets_data,
            }
            if doc.extraction:
                doc.extraction.structured_data = clean_struct
                doc.extraction.confidence_scores = {"structure_integrity": 1.0, "schema_validation": 1.0}
            
            if doc.validation:
                doc.validation.is_valid = True
                doc.validation.review_status = "PASSED"
                doc.validation.math_errors = []
                doc.validation.business_errors = []
                doc.validation.warnings = []
                val_report = ValidationReport(
                    is_valid=True,
                    review_status="PASSED",
                    math_errors=[],
                    business_errors=[],
                    warnings=[]
                )
            db.commit()
        except Exception as e:
            logger.error(f"Error parsing spreadsheet sheets for {document_id}: {e}")

    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        page_count=doc.page_count,
        status=doc.status,
        error_message=doc.error_message,
        created_at=doc.created_at,
        structured_data=doc.extraction.structured_data if doc.extraction else None,
        sheets=sheets_data,
        is_spreadsheet=is_spreadsheet,
        confidence_scores=doc.extraction.confidence_scores if doc.extraction else None,
        validation=val_report,
        raw_text=doc.extraction.raw_text if doc.extraction else None
    )

@router.get("/{document_id}/download")
def download_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc or not Path(doc.file_path).exists():
        raise HTTPException(status_code=404, detail="Document file not found on disk or access denied")
    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type="application/octet-stream"
    )

@router.put("/{document_id}/corrections")
def update_manual_correction(
    document_id: str,
    correction: ManualCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc or not doc.extraction:
        raise HTTPException(status_code=404, detail="Document or extraction record not found")

    old_data = doc.extraction.structured_data or {}
    new_data = correction.structured_data

    # Log changes
    for key, new_val in new_data.items():
        old_val = old_data.get(key)
        if old_val != new_val:
            audit = AuditLog(
                document_id=document_id,
                field_name=key,
                old_value=str(old_val),
                new_value=str(new_val),
                modified_by=correction.modified_by or current_user.email
            )
            db.add(audit)

    # Save new structured data
    doc.extraction.structured_data = new_data

    # Re-run validation on corrected values
    validated_schema = InvoiceExtractionSchema(**new_data)
    val_report = DocumentValidator.validate(validated_schema, current_doc_id=document_id, db=db)

    if doc.validation:
        doc.validation.is_valid = val_report.is_valid
        doc.validation.review_status = "PASSED" if val_report.is_valid else "WARNING"
        doc.validation.math_errors = val_report.math_errors
        doc.validation.business_errors = val_report.business_errors
        doc.validation.warnings = val_report.warnings

    db.commit()
    return {"message": "Document corrected and re-validated successfully", "validation": val_report.model_dump()}

@router.get("/{document_id}/audit-logs")
def get_document_audit_logs(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.document_id == document_id)
        .order_by(AuditLog.modified_at.desc())
        .all()
    )
    return [
        {
            "id": l.id,
            "document_id": l.document_id,
            "field_name": l.field_name,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "modified_by": l.modified_by,
            "modified_at": l.modified_at.isoformat()
        }
        for l in logs
    ]

class BulkDeleteRequest(BaseModel):
    document_ids: List[str]

@router.post("/bulk-delete")
def bulk_delete_documents(
    payload: BulkDeleteRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc_ids = payload.document_ids
    if not doc_ids:
        return {"deleted_count": 0}

    deleted_count = 0
    for doc_id in doc_ids:
        doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
        if doc:
            try:
                fpath = Path(doc.file_path)
                if fpath.exists():
                    fpath.unlink()
            except Exception:
                pass

            db.query(CrossVerification).filter(
                (CrossVerification.source_doc_id == doc_id) |
                (CrossVerification.target_doc_id == doc_id)
            ).delete(synchronize_session=False)

            db.delete(doc)
            deleted_count += 1

    db.commit()
    return {"deleted_count": deleted_count, "document_ids": doc_ids}

@router.delete("/{document_id}")
def delete_document(
    document_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Remove physical file on disk if exists
    try:
        fpath = Path(doc.file_path)
        if fpath.exists():
            fpath.unlink()
    except Exception as e:
        logger.warning(f"Could not remove physical file for {document_id}: {e}")

    # Remove cross-verifications associated with this document
    db.query(CrossVerification).filter(
        (CrossVerification.source_doc_id == document_id) |
        (CrossVerification.target_doc_id == document_id)
    ).delete(synchronize_session=False)

    # Delete Document (cascades to extraction, validation, audit_logs)
    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.filename}' deleted successfully", "id": document_id}
