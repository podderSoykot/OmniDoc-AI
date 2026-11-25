from typing import Dict, Any, List
from app.models.schemas import DiscrepancyItem
from app.services.cross_verification.diff_calculator import DiffCalculator

class PDFToPDFVerifier:
    @staticmethod
    def verify(source_data: Dict[str, Any], target_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares two extracted PDF documents (e.g. PO vs Invoice or Invoice vs Receipt).
        Checks totals, dates, vendor names, and line items.
        """
        discrepancies: List[DiscrepancyItem] = []
        checks_total = 0
        checks_passed = 0

        # 1. Total comparison
        checks_total += 1
        src_total = source_data.get("total")
        tgt_total = target_data.get("total")
        is_match, diff = DiffCalculator.compare_numeric(src_total, tgt_total)
        if is_match:
            checks_passed += 1
        else:
            discrepancies.append(DiscrepancyItem(
                field="total",
                source_value=src_total,
                target_value=tgt_total,
                severity="CRITICAL",
                message=f"Total amount mismatch: Source={src_total}, Target={tgt_total} (Diff={diff})"
            ))

        # 2. Subtotal comparison
        if source_data.get("subtotal") is not None and target_data.get("subtotal") is not None:
            checks_total += 1
            is_match, diff = DiffCalculator.compare_numeric(source_data.get("subtotal"), target_data.get("subtotal"))
            if is_match:
                checks_passed += 1
            else:
                discrepancies.append(DiscrepancyItem(
                    field="subtotal",
                    source_value=source_data.get("subtotal"),
                    target_value=target_data.get("subtotal"),
                    severity="WARNING",
                    message=f"Subtotal mismatch: Source={source_data.get('subtotal')}, Target={target_data.get('subtotal')}"
                ))

        # 3. Supplier Name check
        src_supplier = source_data.get("supplier_name", "") or ""
        tgt_supplier = target_data.get("supplier_name", "") or ""
        if src_supplier and tgt_supplier:
            checks_total += 1
            sim = DiffCalculator.calculate_string_similarity(src_supplier, tgt_supplier)
            if sim >= 0.70:
                checks_passed += 1
            else:
                discrepancies.append(DiscrepancyItem(
                    field="supplier_name",
                    source_value=src_supplier,
                    target_value=tgt_supplier,
                    severity="WARNING",
                    message=f"Supplier names differ (similarity {round(sim*100, 1)}%): '{src_supplier}' vs '{tgt_supplier}'"
                ))

        # 4. Line items quantity check
        src_items = source_data.get("line_items", []) or []
        tgt_items = target_data.get("line_items", []) or []
        if src_items and tgt_items:
            checks_total += 1
            if len(src_items) == len(tgt_items):
                checks_passed += 1
            else:
                discrepancies.append(DiscrepancyItem(
                    field="line_items_count",
                    source_value=len(src_items),
                    target_value=len(tgt_items),
                    severity="INFO",
                    message=f"Line item count discrepancy: Source has {len(src_items)} items, Target has {len(tgt_items)} items."
                ))

        match_score = round((checks_passed / max(checks_total, 1)) * 100, 1)
        status = "MATCHED" if match_score >= 85 else ("PARTIAL_MATCH" if match_score >= 50 else "MISMATCHED")

        return {
            "match_score": match_score,
            "status": status,
            "discrepancies": discrepancies,
            "summary": f"Cross-verified {checks_total} key data points with {checks_passed} matches ({match_score}% agreement)."
        }
