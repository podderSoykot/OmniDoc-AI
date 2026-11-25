from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentExtraction, ValidationResult
from app.models.schemas import DocumentListItemResponse

class SearchService:
    @staticmethod
    def search_documents(
        db: Session,
        query: Optional[str] = None,
        review_status: Optional[str] = None,
        file_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DocumentListItemResponse]:
        """
        Executes hybrid filtering: keyword search on filename, supplier, invoice number,
        and extracted text, plus structured filters.
        """
        stmt = db.query(Document).outerjoin(DocumentExtraction).outerjoin(ValidationResult)

        if file_type:
            stmt = stmt.filter(Document.file_type == file_type)

        if review_status:
            stmt = stmt.filter(ValidationResult.review_status == review_status)

        docs = stmt.order_by(Document.created_at.desc()).limit(limit).offset(offset).all()

        results = []
        q_lower = query.lower().strip() if query else ""

        for doc in docs:
            struct = doc.extraction.structured_data if doc.extraction else {}
            raw = doc.extraction.raw_text if doc.extraction else ""
            status = doc.validation.review_status if doc.validation else "PENDING"

            # Filter by query string if specified
            if q_lower:
                matchable_strings = [
                    doc.filename.lower(),
                    str(struct.get("invoice_number", "")).lower(),
                    str(struct.get("supplier_name", "")).lower(),
                    str(struct.get("customer_name", "")).lower(),
                    raw[:2000].lower()
                ]
                if not any(q_lower in s for s in matchable_strings):
                    continue

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
            if not supplier and doc.file_type in ("excel", "csv"):
                if struct and struct.get("total_sheets"):
                    supplier = f"{struct.get('total_sheets')} Sheets ({struct.get('total_records', 0):,} records)"
                else:
                    supplier = "Multi-Sheet Ledger"

            results.append(DocumentListItemResponse(
                id=doc.id,
                filename=doc.filename,
                file_type=doc.file_type,
                file_size_bytes=doc.file_size_bytes,
                page_count=doc.page_count,
                status=doc.status,
                review_status=status,
                total=total_val,
                currency=struct.get("currency") if struct else "USD",
                supplier_name=supplier,
                created_at=doc.created_at
            ))

        return results
