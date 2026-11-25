from typing import Optional
from sqlalchemy.orm import Session
from app.models.schemas import InvoiceExtractionSchema, ValidationReport
from app.models.document import Document, DocumentExtraction
from app.services.validation.math_rules import MathValidationRules
from app.services.validation.business_rules import BusinessValidationRules

class DocumentValidator:
    @staticmethod
    def validate(
        data: InvoiceExtractionSchema, 
        current_doc_id: Optional[str] = None, 
        db: Optional[Session] = None
    ) -> ValidationReport:
        """
        Runs comprehensive math and business validation.
        Determines overall review status: PASSED, WARNING, NEEDS_MANUAL_REVIEW, or FAILED.
        """
        # Duplicate detection query
        is_duplicate = False
        if db and data.invoice_number and data.supplier_name:
            existing = (
                db.query(Document)
                .join(DocumentExtraction)
                .filter(
                    Document.id != current_doc_id,
                    Document.status == "completed"
                ).all()
            )
            for doc in existing:
                if doc.extraction and doc.extraction.structured_data:
                    struct = doc.extraction.structured_data
                    if (struct.get("invoice_number") == data.invoice_number and
                        struct.get("supplier_name", "").lower() == data.supplier_name.lower()):
                        is_duplicate = True
                        break

        math_errs, math_warns = MathValidationRules.validate_totals(data)
        biz_errs, biz_warns = BusinessValidationRules.validate_business_logic(data, is_duplicate)

        all_errors = math_errs + biz_errs
        all_warnings = math_warns + biz_warns

        # Determine Review Status
        if len(all_errors) > 0:
            if any("mismatch" in e.lower() or "missing mandatory" in e.lower() for e in all_errors):
                status = "NEEDS_MANUAL_REVIEW"
            else:
                status = "FAILED"
            is_valid = False
        elif len(all_warnings) > 0:
            status = "WARNING"
            is_valid = True
        else:
            status = "PASSED"
            is_valid = True

        return ValidationReport(
            is_valid=is_valid,
            review_status=status,
            math_errors=math_errs,
            business_errors=biz_errs,
            warnings=all_warnings
        )
