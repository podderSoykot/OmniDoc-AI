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
        target_sheets: Optional[Dict[str, Any]] = None
    ) -> CrossVerifyResponse:
        """
        Dispatches cross-verification based on document types (PDF-PDF or PDF-Excel).
        """
        verify_id = str(uuid.uuid4())

        if target_type in ("excel", "csv") and target_sheets:
            res = PDFToExcelVerifier.verify(source_data, target_sheets)
            v_type = "pdf_excel"
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
