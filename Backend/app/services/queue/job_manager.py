import asyncio
import traceback
from typing import Dict, Any, Optional, List
import datetime
from pathlib import Path
from app.core.database import SessionLocal
from app.core.logging_config import logger
from app.core.config import settings
from app.models.document import Document, DocumentExtraction, ValidationResult, ProcessingJob
from app.models.schemas import JobStatusResponse, DeadLetterJobResponse
from app.services.ingestion.processor import DocumentIngestionProcessor
from app.services.extraction.extractor import ExtractionOrchestrator
from app.services.validation.validator import DocumentValidator

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class JobManager:
    # Memory cache for fast lookups
    _jobs: Dict[str, Dict[str, Any]] = {}
    _cancelled_jobs: set = set()

    @classmethod
    def create_job(cls, job_id: str, document_id: str, user_id: Optional[str] = None) -> None:
        now = utcnow()
        job_data = {
            "job_id": job_id,
            "document_id": document_id,
            "user_id": user_id,
            "status": "pending",
            "progress_percentage": 0,
            "current_step": "Queued",
            "error": None,
            "retry_count": 0,
            "max_retries": settings.JOB_MAX_RETRIES,
            "is_dead_letter": False,
            "updated_at": now
        }
        cls._jobs[job_id] = job_data

        # Persist to DB
        db = SessionLocal()
        try:
            db_job = ProcessingJob(
                id=job_id,
                document_id=document_id,
                user_id=user_id,
                status="pending",
                progress_percentage=0,
                current_step="Queued",
                retry_count=0,
                max_retries=settings.JOB_MAX_RETRIES,
                is_dead_letter=False
            )
            db.merge(db_job)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to persist job {job_id} to DB: {e}")
            db.rollback()
        finally:
            db.close()

    @classmethod
    def get_job(cls, job_id: str) -> Optional[JobStatusResponse]:
        # Check cache
        job = cls._jobs.get(job_id)
        if job:
            return JobStatusResponse(**job)

        # Fallback to DB
        db = SessionLocal()
        try:
            db_job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if db_job:
                job_dict = {
                    "job_id": db_job.id,
                    "document_id": db_job.document_id,
                    "status": db_job.status,
                    "progress_percentage": db_job.progress_percentage,
                    "current_step": db_job.current_step,
                    "error": db_job.error,
                    "retry_count": db_job.retry_count,
                    "max_retries": db_job.max_retries,
                    "is_dead_letter": db_job.is_dead_letter,
                }
                cls._jobs[job_id] = job_dict
                return JobStatusResponse(**job_dict)
            return None
        finally:
            db.close()

    @classmethod
    def cancel_job(cls, job_id: str) -> bool:
        cls._cancelled_jobs.add(job_id)
        cls.update_job(job_id, status="cancelled", progress=0, step="Cancelled by user")
        return True

    @classmethod
    def is_cancelled(cls, job_id: str) -> bool:
        return job_id in cls._cancelled_jobs

    @classmethod
    def update_job(
        cls, 
        job_id: str, 
        status: str, 
        progress: int, 
        step: str, 
        error: Optional[str] = None,
        retry_count: Optional[int] = None,
        is_dead_letter: Optional[bool] = None
    ) -> None:
        now = utcnow()
        if job_id in cls._jobs:
            cls._jobs[job_id]["status"] = status
            cls._jobs[job_id]["progress_percentage"] = progress
            cls._jobs[job_id]["current_step"] = step
            cls._jobs[job_id]["error"] = error
            cls._jobs[job_id]["updated_at"] = now
            if retry_count is not None:
                cls._jobs[job_id]["retry_count"] = retry_count
            if is_dead_letter is not None:
                cls._jobs[job_id]["is_dead_letter"] = is_dead_letter

        # Sync to DB
        db = SessionLocal()
        try:
            db_job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if db_job:
                db_job.status = status
                db_job.progress_percentage = progress
                db_job.current_step = step
                db_job.error = error
                db_job.updated_at = now
                if retry_count is not None:
                    db_job.retry_count = retry_count
                if is_dead_letter is not None:
                    db_job.is_dead_letter = is_dead_letter
                db.commit()
        except Exception as e:
            logger.error(f"Failed to update job {job_id} in DB: {e}")
            db.rollback()
        finally:
            db.close()

    @classmethod
    def get_dead_letter_jobs(cls, user_id: Optional[str] = None) -> List[DeadLetterJobResponse]:
        db = SessionLocal()
        try:
            query = db.query(ProcessingJob).filter(ProcessingJob.is_dead_letter == True)
            if user_id:
                query = query.filter(ProcessingJob.user_id == user_id)
            dead_jobs = query.order_by(ProcessingJob.updated_at.desc()).all()
            
            results = []
            for j in dead_jobs:
                doc = db.query(Document).filter(Document.id == j.document_id).first()
                results.append(DeadLetterJobResponse(
                    job_id=j.id,
                    document_id=j.document_id,
                    filename=doc.filename if doc else None,
                    status=j.status,
                    error=j.error,
                    retry_count=j.retry_count,
                    max_retries=j.max_retries,
                    created_at=j.created_at,
                    updated_at=j.updated_at
                ))
            return results
        finally:
            db.close()

    @classmethod
    async def process_document_job(cls, job_id: str, document_id: str, file_path_str: str) -> None:
        """
        Background worker pipeline with retry, timeout, cancellation, and DLQ handling.
        """
        max_retries = settings.JOB_MAX_RETRIES
        timeout = settings.JOB_TIMEOUT_SECONDS

        for attempt in range(max_retries):
            if cls.is_cancelled(job_id):
                logger.info(f"Job {job_id} was cancelled before attempt {attempt + 1}.")
                cls.update_job(job_id, "cancelled", 0, "Processing cancelled")
                return

            try:
                # Wrap execution in timeout
                await asyncio.wait_for(
                    cls._execute_pipeline(job_id, document_id, file_path_str),
                    timeout=timeout
                )
                # Success
                return

            except asyncio.TimeoutError:
                err_msg = f"Job timed out after {timeout} seconds (attempt {attempt + 1}/{max_retries})."
                logger.warning(f"Timeout on job {job_id}: {err_msg}")
                if attempt + 1 < max_retries:
                    cls.update_job(
                        job_id, "processing", 10, 
                        f"Retrying after timeout (attempt {attempt + 2}/{max_retries})",
                        error=err_msg, retry_count=attempt + 1
                    )
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    # Move to DLQ
                    cls.update_job(
                        job_id, "failed", 100, "Dead-letter: Timeout limit exceeded",
                        error=err_msg, retry_count=attempt + 1, is_dead_letter=True
                    )
                    cls._mark_doc_failed(document_id, err_msg)
                    return

            except Exception as e:
                err_msg = f"Error during processing: {str(e)} (attempt {attempt + 1}/{max_retries})"
                logger.error(f"Job {job_id} error: {err_msg}\n{traceback.format_exc()}")
                if attempt + 1 < max_retries:
                    cls.update_job(
                        job_id, "processing", 10,
                        f"Retrying after error (attempt {attempt + 2}/{max_retries})",
                        error=err_msg, retry_count=attempt + 1
                    )
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                else:
                    # Move to DLQ
                    cls.update_job(
                        job_id, "failed", 100, "Dead-letter: Max retry attempts exhausted",
                        error=str(e), retry_count=attempt + 1, is_dead_letter=True
                    )
                    cls._mark_doc_failed(document_id, str(e))
                    return

    @classmethod
    def _mark_doc_failed(cls, document_id: str, error_msg: str):
        db = SessionLocal()
        try:
            doc_record = db.query(Document).filter(Document.id == document_id).first()
            if doc_record:
                doc_record.status = "failed"
                doc_record.error_message = error_msg
                db.commit()
        finally:
            db.close()

    @classmethod
    async def _execute_pipeline(cls, job_id: str, document_id: str, file_path_str: str) -> None:
        db = SessionLocal()
        file_path = Path(file_path_str)

        try:
            cls.update_job(job_id, "processing", 15, "Parsing document & OCR")
            doc_record = db.query(Document).filter(Document.id == document_id).first()
            if not doc_record:
                raise ValueError(f"Document {document_id} not found in database.")

            doc_record.status = "processing"
            db.commit()

            if cls.is_cancelled(job_id):
                return

            # Step 1: Ingestion & OCR
            ingestion_res = DocumentIngestionProcessor.process_document(file_path)
            raw_text = ingestion_res["raw_text"]
            doc_record.page_count = ingestion_res["page_count"]
            doc_record.file_type = ingestion_res["file_type"]

            if cls.is_cancelled(job_id):
                return

            # Step 2: Extraction & Analysis
            if ingestion_res["file_type"] in ("excel", "csv"):
                cls.update_job(job_id, "processing", 55, "Analyzing spreadsheet worksheets and quantitative metrics")
                from app.services.ingestion.excel_parser import ExcelParser
                summary = ExcelParser.summarize_spreadsheet(ingestion_res.get("sheets") or {})
                struct_payload = {
                    "document_type": "spreadsheet_ledger",
                    "is_spreadsheet": True,
                    "total_records": summary["total_records"],
                    "total_sheets": summary["total_sheets"],
                    "sheet_summaries": summary["sheet_summaries"],
                    "primary_metrics": summary["primary_metrics"],
                    "sheets": ingestion_res.get("sheets") or {},
                }
                confidences = {"structure_integrity": 1.0, "schema_validation": 1.0}
                latency = 25
                val_is_valid = True
                val_review_status = "PASSED"
                val_math_errors = []
                val_business_errors = []
                val_warnings = []
            else:
                cls.update_job(job_id, "processing", 55, "Extracting structured financial fields via AI")
                extracted_schema, confidences, latency = await ExtractionOrchestrator.extract(raw_text)

                if cls.is_cancelled(job_id):
                    return

                # Step 3: Validation
                cls.update_job(job_id, "processing", 85, "Executing mathematical & business validation")
                val_report = DocumentValidator.validate(extracted_schema, current_doc_id=document_id, db=db)
                struct_payload = extracted_schema.model_dump()
                val_is_valid = val_report.is_valid
                val_review_status = val_report.review_status
                val_math_errors = val_report.math_errors
                val_business_errors = val_report.business_errors
                val_warnings = val_report.warnings

            if cls.is_cancelled(job_id):
                return

            # Step 4: Persist to DB
            extraction_rec = DocumentExtraction(
                document_id=document_id,
                raw_text=raw_text,
                structured_data=struct_payload,
                confidence_scores=confidences,
                processing_time_ms=latency
            )
            db.merge(extraction_rec)

            val_rec = ValidationResult(
                document_id=document_id,
                is_valid=val_is_valid,
                review_status=val_review_status,
                math_errors=val_math_errors,
                business_errors=val_business_errors,
                warnings=val_warnings
            )
            db.merge(val_rec)

            doc_record.status = "completed"
            doc_record.error_message = None
            db.commit()

            cls.update_job(job_id, "completed", 100, "Completed successfully")
            logger.info(f"Job {job_id} for doc {document_id} completed successfully.")

        finally:
            db.close()
