from typing import Dict, Any, List
from app.models.schemas import DiscrepancyItem
from app.services.cross_verification.diff_calculator import DiffCalculator

class PDFToExcelVerifier:
    @staticmethod
    def verify(
        pdf_data: Dict[str, Any], 
        excel_sheets: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Cross-verifies PDF invoice data against Excel rows/records (e.g. general ledger or bank transactions).
        Searches all sheets for matching invoice number, amount, or vendor.
        """
        discrepancies: List[DiscrepancyItem] = []
        pdf_inv = str(pdf_data.get("invoice_number") or "").strip().lower()
        pdf_total = pdf_data.get("total")
        pdf_supplier = str(pdf_data.get("supplier_name") or "").strip().lower()

        found_match = False
        best_row = None
        best_sheet = ""

        # Search through all sheets and rows
        for sheet_name, rows in excel_sheets.items():
            for row in rows:
                row_str = " ".join(str(v).lower() for v in row.values())
                
                # Check 1: exact invoice number match in any cell
                if pdf_inv and pdf_inv in row_str:
                    found_match = True
                    best_row = row
                    best_sheet = sheet_name
                    break
                
                # Check 2: total amount match in any cell
                if pdf_total is not None and str(pdf_total) in row_str:
                    found_match = True
                    best_row = row
                    best_sheet = sheet_name
                    break

            if found_match:
                break

        if not found_match:
            discrepancies.append(DiscrepancyItem(
                field="transaction_record",
                source_value=f"Invoice #{pdf_inv or 'N/A'} (Total: {pdf_total})",
                target_value="None found in Excel sheets",
                severity="CRITICAL",
                message="No corresponding transaction or ledger entry found in Excel spreadsheet."
            ))
            return {
                "match_score": 0.0,
                "status": "MISMATCHED",
                "discrepancies": discrepancies,
                "summary": "Document not found in spreadsheet records."
            }

        # Compare matching row values
        checks_total = 2
        checks_passed = 1  # Record was found

        # Verify amount if identifiable in row
        row_values_numeric = []
        for val in best_row.values():
            try:
                row_values_numeric.append(float(str(val).replace(",", "")))
            except (ValueError, TypeError):
                continue

        amount_matched = False
        if pdf_total is not None:
            for num in row_values_numeric:
                is_match, _ = DiffCalculator.compare_numeric(pdf_total, num)
                if is_match:
                    amount_matched = True
                    break

        if amount_matched:
            checks_passed += 1
        else:
            discrepancies.append(DiscrepancyItem(
                field="amount_verification",
                source_value=pdf_total,
                target_value=row_values_numeric,
                severity="WARNING",
                message=f"Excel row found in sheet '{best_sheet}', but amount {pdf_total} could not be confirmed in row cells."
            ))

        match_score = round((checks_passed / checks_total) * 100, 1)
        status = "MATCHED" if match_score >= 80 else "PARTIAL_MATCH"

        return {
            "match_score": match_score,
            "status": status,
            "discrepancies": discrepancies,
            "summary": f"Cross-verified against Excel sheet '{best_sheet}' with score {match_score}%."
        }
