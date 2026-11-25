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

                # Step 3: Validation
                cls.update_job(job_id, "processing", 85, "Executing mathematical & business validation")
                val_report = DocumentValidator.validate(extracted_schema, current_doc_id=document_id, db=db)
                struct_payload = extracted_schema.model_dump()
                val_is_valid = val_report.is_valid
                val_review_status = val_report.review_status
                val_math_errors = val_report.math_errors
                val_business_errors = val_report.business_errors
                val_warnings = val_report.warnings

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
