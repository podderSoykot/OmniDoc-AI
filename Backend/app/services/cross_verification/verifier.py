import uuid
from typing import Dict, Any, Optional
from app.models.schemas import CrossVerifyResponse
from app.services.cross_verification.pdf_pdf_verifier import PDFToPDFVerifier
from app.services.cross_verification.pdf_excel_verifier import PDFToExcelVerifier

class CrossVerificationOrchestrator:
    @staticmethod
    def cross_verify(
        source_doc_id: str,
        target_doc_id: str,
        source_type: str,
        target_type: str,
        source_data: Dict[str, Any],
        target_data: Dict[str, Any],
        target_sheets: Optional[Dict[str, Any]] = None,
        source_sheets: Optional[Dict[str, Any]] = None
    ) -> CrossVerifyResponse:
        """
        Dispatches cross-verification symmetrically based on document types (PDF-PDF or PDF-Excel or Excel-PDF).
        """
        verify_id = str(uuid.uuid4())

        source_is_sheet = source_type in ("excel", "csv") or bool(source_sheets)
        target_is_sheet = target_type in ("excel", "csv") or bool(target_sheets)

        if target_sheets and (target_is_sheet or not source_is_sheet):
            res = PDFToExcelVerifier.verify(source_data, target_sheets)
            v_type = "pdf_excel"
        elif source_sheets and (source_is_sheet or not target_is_sheet):
            res = PDFToExcelVerifier.verify(target_data, source_sheets)
            v_type = "excel_pdf"
        else:
            res = PDFToPDFVerifier.verify(source_data, target_data)
            v_type = "pdf_pdf"

        return CrossVerifyResponse(
            id=verify_id,
            source_doc_id=source_doc_id,
            target_doc_id=target_doc_id,
            verification_type=v_type,
            match_score=res["match_score"],
            status=res["status"],
            discrepancies=res["discrepancies"],
            summary=res["summary"]
        )
