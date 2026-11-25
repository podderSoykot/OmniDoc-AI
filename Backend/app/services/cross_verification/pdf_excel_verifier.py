from typing import Dict, Any, List, Optional
from app.models.schemas import DiscrepancyItem
from app.services.cross_verification.diff_calculator import DiffCalculator

class PDFToExcelVerifier:
    @staticmethod
    def verify(
        pdf_data: Dict[str, Any], 
        excel_sheets: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Cross-verifies PDF invoice/PO data against multi-sheet Excel spreadsheet records.
        Performs multi-criteria fuzzy search, amount reconciliation, and vendor confirmation.
        """
        discrepancies: List[DiscrepancyItem] = []
        pdf_inv = str(pdf_data.get("invoice_number") or "").strip().lower()
        pdf_total = pdf_data.get("total")
        pdf_subtotal = pdf_data.get("subtotal")
        pdf_tax = pdf_data.get("tax")
        pdf_supplier = str(pdf_data.get("supplier_name") or "").strip().lower()
        pdf_date = str(pdf_data.get("invoice_date") or "").strip()

        best_row: Optional[Dict[str, Any]] = None
        best_sheet = ""
        best_match_strength = 0

        # Search across all sheets and records
        for sheet_name, rows in excel_sheets.items():
            for row in rows:
                match_strength = 0
                row_str = " ".join(str(v).lower() for v in row.values())

                # Check 1: Exact identifier match
                if pdf_inv and len(pdf_inv) > 2 and pdf_inv in row_str:
                    match_strength += 5

                # Check 2: Vendor name similarity or substring
                if pdf_supplier and len(pdf_supplier) > 3:
                    if pdf_supplier in row_str:
                        match_strength += 3
                    else:
                        for v in row.values():
                            sim = DiffCalculator.calculate_string_similarity(pdf_supplier, str(v).lower())
                            if sim >= 0.70:
                                match_strength += 2
                                break

                # Check 3: Numeric amounts in row cells
                if pdf_total is not None:
                    for v in row.values():
                        try:
                            clean_num = float(str(v).replace(",", "").replace("$", ""))
                            is_match, _ = DiffCalculator.compare_numeric(pdf_total, clean_num)
                            if is_match:
                                match_strength += 4
                                break
                        except (ValueError, TypeError):
                            continue

                if match_strength > best_match_strength:
                    best_match_strength = match_strength
                    best_row = row
                    best_sheet = sheet_name

        # If no correlation found
        if not best_row or best_match_strength < 2:
            discrepancies.append(DiscrepancyItem(
                field="transaction_existence",
                source_value=f"{pdf_inv.upper() or 'N/A'} (${pdf_total})",
                target_value="Not Found",
                severity="CRITICAL",
                message="No corresponding transaction or ledger entry found across spreadsheet worksheets."
            ))
            return {
                "match_score": 0.0,
                "status": "MISMATCHED",
                "discrepancies": discrepancies,
                "summary": "Document could not be matched with any record in the spreadsheet ledger."
            }

        # Step 2: Detailed field-by-field verification of matching row
        checks_total = 0
        checks_passed = 0

        # Check 1: Record existence
        checks_total += 1
        checks_passed += 1

        # Check 2: Total Amount
        checks_total += 1
        row_numbers = []
        for v in best_row.values():
            try:
                row_numbers.append(float(str(v).replace(",", "").replace("$", "")))
            except (ValueError, TypeError):
                continue

        total_matched = False
        if pdf_total is not None:
            for num in row_numbers:
                is_match, diff = DiffCalculator.compare_numeric(pdf_total, num)
                if is_match:
                    total_matched = True
                    checks_passed += 1
                    break

            if not total_matched:
                discrepancies.append(DiscrepancyItem(
                    field="grand_total",
                    source_value=f"${pdf_total}",
                    target_value=str(row_numbers),
                    severity="CRITICAL",
                    message=f"Total amount mismatch: Source requires ${pdf_total}, but row in sheet '{best_sheet}' has values {row_numbers}."
                ))

        # Check 3: Vendor / Supplier Name (if row has vendor-like columns)
        vendor_col = next((k for k in best_row.keys() if any(t in k.lower() for t in ("vendor", "supplier", "payee", "company", "party", "name"))), None)
        if pdf_supplier and vendor_col:
            checks_total += 1
            best_vendor_val = str(best_row[vendor_col]).strip()
            sim = DiffCalculator.calculate_string_similarity(pdf_supplier, best_vendor_val.lower())
            if sim >= 0.60 or pdf_supplier in best_vendor_val.lower():
                checks_passed += 1
            else:
                discrepancies.append(DiscrepancyItem(
                    field="vendor_name",
                    source_value=pdf_data.get("supplier_name"),
                    target_value=best_vendor_val,
                    severity="WARNING",
                    message=f"Vendor name disparity: Source has '{pdf_data.get('supplier_name')}' vs Spreadsheet entry '{best_vendor_val}'."
                ))

        # Check 4: Subtotal comparison if row contains subtotal
        subtotal_col = next((k for k in best_row.keys() if "subtotal" in k.lower()), None)
        if subtotal_col and pdf_subtotal is not None:
            checks_total += 1
            try:
                row_sub = float(str(best_row[subtotal_col]).replace(",", "").replace("$", ""))
                is_match, _ = DiffCalculator.compare_numeric(pdf_subtotal, row_sub)
                if is_match:
                    checks_passed += 1
                else:
                    discrepancies.append(DiscrepancyItem(
                        field="subtotal",
                        source_value=f"${pdf_subtotal}",
                        target_value=f"${row_sub}",
                        severity="WARNING",
                        message=f"Subtotal discrepancy: Source=${pdf_subtotal} vs Spreadsheet ${row_sub}."
                    ))
            except (ValueError, TypeError):
                pass

        # Check 5: Tax comparison if row contains tax
        tax_col = next((k for k in best_row.keys() if "tax" in k.lower()), None)
        if tax_col and pdf_tax is not None:
            checks_total += 1
            try:
                row_tax = float(str(best_row[tax_col]).replace(",", "").replace("$", ""))
                is_match, _ = DiffCalculator.compare_numeric(pdf_tax, row_tax)
                if is_match:
                    checks_passed += 1
                else:
                    discrepancies.append(DiscrepancyItem(
                        field="tax_amount",
                        source_value=f"${pdf_tax}",
                        target_value=f"${row_tax}",
                        severity="INFO",
                        message=f"Tax amount discrepancy: Source=${pdf_tax} vs Spreadsheet ${row_tax}."
                    ))
            except (ValueError, TypeError):
                pass

        match_score = round((checks_passed / max(checks_total, 1)) * 100, 1)
        status = "MATCHED" if match_score >= 80 else ("PARTIAL_MATCH" if match_score >= 50 else "MISMATCHED")

        # Include matched row metadata in summary
        row_preview = ", ".join(f"{k}: {v}" for k, v in list(best_row.items())[:4])
        return {
            "match_score": match_score,
            "status": status,
            "discrepancies": discrepancies,
            "summary": f"Reconciled with '{best_sheet}' ({match_score}% agreement). Matched: [{row_preview}]."
        }
