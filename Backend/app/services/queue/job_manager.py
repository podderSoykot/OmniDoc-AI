import asyncio
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from app.core.database import SessionLocal
from app.core.logging_config import logger
from app.models.document import Document, DocumentExtraction, ValidationResult
from app.models.schemas import JobStatusResponse
from app.services.ingestion.processor import DocumentIngestionProcessor
from app.services.extraction.extractor import ExtractionOrchestrator
from app.services.validation.validator import DocumentValidator

class JobManager:
    # In-memory job tracking store
    _jobs: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def create_job(cls, job_id: str, document_id: str) -> None:
        cls._jobs[job_id] = {
            "job_id": job_id,
            "document_id": document_id,
            "status": "pending",
            "progress_percentage": 0,
            "current_step": "Queued",
            "error": None,
            "updated_at": datetime.utcnow()
        }

    @classmethod
    def get_job(cls, job_id: str) -> Optional[JobStatusResponse]:
        job = cls._jobs.get(job_id)
        if not job:
            return None
        return JobStatusResponse(**job)

    @classmethod
    def update_job(cls, job_id: str, status: str, progress: int, step: str, error: Optional[str] = None) -> None:
        if job_id in cls._jobs:
            cls._jobs[job_id]["status"] = status
            cls._jobs[job_id]["progress_percentage"] = progress
            cls._jobs[job_id]["current_step"] = step
            cls._jobs[job_id]["error"] = error
            cls._jobs[job_id]["updated_at"] = datetime.utcnow()

    @classmethod
    async def process_document_job(cls, job_id: str, document_id: str, file_path_str: str) -> None:
        """
        Background worker pipeline:
        1. Ingestion & OCR
        2. AI Information Extraction
        3. Validation
        4. DB persistence
        """
        db = SessionLocal()
        file_path = Path(file_path_str)

        try:
            cls.update_job(job_id, "processing", 15, "Parsing document & OCR")
            doc_record = db.query(Document).filter(Document.id == document_id).first()
            if not doc_record:
                raise ValueError(f"Document {document_id} not found in database.")

            doc_record.status = "processing"
            db.commit()

            # Step 1: Ingestion & OCR
            ingestion_res = DocumentIngestionProcessor.process_document(file_path)
            raw_text = ingestion_res["raw_text"]
            doc_record.page_count = ingestion_res["page_count"]
            doc_record.file_type = ingestion_res["file_type"]

            # Step 2: AI Extraction
            cls.update_job(job_id, "processing", 55, "Extracting structured financial fields via AI")
            extracted_schema, confidences, latency = await ExtractionOrchestrator.extract(raw_text)

            # Step 3: Validation
            cls.update_job(job_id, "processing", 85, "Executing mathematical & business validation")
            val_report = DocumentValidator.validate(extracted_schema, current_doc_id=document_id, db=db)

            # Step 4: Persist to DB
            extraction_rec = DocumentExtraction(
                document_id=document_id,
                raw_text=raw_text,
                structured_data=extracted_schema.model_dump(),
                confidence_scores=confidences,
                processing_time_ms=latency
            )
            db.merge(extraction_rec)

            val_rec = ValidationResult(
                document_id=document_id,
                is_valid=val_report.is_valid,
                review_status=val_report.review_status,
                math_errors=val_report.math_errors,
                business_errors=val_report.business_errors,
                warnings=val_report.warnings
            )
            db.merge(val_rec)

            doc_record.status = "completed"
            doc_record.error_message = None
            db.commit()

            cls.update_job(job_id, "completed", 100, "Completed successfully")
            logger.info(f"Job {job_id} for doc {document_id} completed successfully.")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}\n{traceback.format_exc()}")
            cls.update_job(job_id, "failed", 100, "Failed", error=str(e))
            doc_record = db.query(Document).filter(Document.id == document_id).first()
            if doc_record:
                doc_record.status = "failed"
                doc_record.error_message = str(e)
                db.commit()
        finally:
            db.close()
