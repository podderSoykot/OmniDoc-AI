import re
from typing import Dict, Any, List, Optional
from app.models.schemas import InvoiceExtractionSchema, LineItemSchema

class HeuristicExtractor:
    @staticmethod
    def extract_from_text(text: str) -> InvoiceExtractionSchema:
        """
        Rule-based pattern extractor for invoices, receipts, and POs.
        Extracts invoice number, dates, totals, supplier, and line items.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        content_lines = [l for l in lines if not re.match(r'^---\s*\[.*?\]\s*---$', l)]

        # 1. Invoice / PO Identifier
        invoice_number = None
        # Explicit "Invoice Number: ..." or "PO Number: ..." on same line
        inv_match = re.search(
            r'(?:invoice|inv|bill|receipt|po)[^\S\r\n]*(?:number|num|no|#)[^\S\r\n]*[:#-][^\S\r\n]*([A-Za-z0-9\-_/]{3,30})',
            text, re.I
        )
        if not inv_match:
            inv_match = re.search(
                r'\b(?:invoice|inv|po)[^\S\r\n]*[:#-][^\S\r\n]*([A-Za-z0-9\-_/]{3,30})',
                text, re.I
            )
        if not inv_match:
            inv_match = re.search(r'\b((?:INV|PO|REC|TXN)[-_][A-Za-z0-9\-_]+)\b', text, re.I)

        if inv_match:
            candidate = inv_match.group(1).strip()
            if candidate.lower() not in ("number", "num", "no", "date", "bill", "invoice", "supply", "total", "subtotal"):
                invoice_number = candidate

        # 2. Date
        date_match = re.search(
            r'(?:date|dated|issue\s*date)[\s.:-]*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})',
            text, re.I
        )
        invoice_date = date_match.group(1) if date_match else None

        # 3. Currency
        curr_match = re.search(r'(\$|€|£|¥|USD|EUR|GBP|BDT|CAD)', text)
        currency = curr_match.group(1) if curr_match else "USD"

        # 4. Totals, Subtotal, Tax
        subtotal = HeuristicExtractor._extract_amount(r'\b(?:subtotal|sub-total|net\s*amount)\b[\s.:$€£]*([\d,]+\.\d{2})', text)
        tax = HeuristicExtractor._extract_amount(r'\b(?:tax|vat|gst)\b[\s.:$€£]*([\d,]+\.\d{2})', text)
        total = HeuristicExtractor._extract_amount(r'(?<!sub)\b(?:total|grand\s*total|amount\s*due)\b[\s.:$€£]*([\d,]+\.\d{2})', text)

        # 5. Supplier / Customer
        supplier_name = "Unknown Supplier"
        supp_match = re.search(r'(?:supplier|vendor|from|company|issued\s*by)[\s.:-]*([^\n]+)', text, re.I)
        if supp_match and supp_match.group(1).strip().lower() not in ("name", "details", "info", "address"):
            supplier_name = supp_match.group(1).strip()
        else:
            for l in content_lines:
                if l.upper() not in ("INVOICE", "TAX INVOICE", "PURCHASE ORDER", "PO", "RECEIPT", "BILL OF LADING", "STATEMENT"):
                    supplier_name = l
                    break

        customer_match = re.search(r'(?:bill\s*to|customer|client|sold\s*to)[\s.:-]*([^\n]+)', text, re.I)
        customer_name = customer_match.group(1).strip() if customer_match else None

        # 6. Line Items Extraction
        line_items = HeuristicExtractor._extract_line_items(lines)

        # Fallbacks for subtotal/total if one is missing
        if subtotal is None and line_items:
            subtotal = round(sum(item.amount for item in line_items), 2)
        if total is None and subtotal is not None:
            total = round(subtotal + (tax or 0.0), 2)

        return InvoiceExtractionSchema(
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            supplier_name=supplier_name,
            customer_name=customer_name,
            subtotal=subtotal,
            tax=tax or 0.0,
            total=total,
            currency=currency,
            line_items=line_items
        )

    @staticmethod
    def _extract_amount(pattern: str, text: str) -> Optional[float]:
        match = re.search(pattern, text, re.I)
        if match:
            clean = match.group(1).replace(",", "")
            try:
                return float(clean)
            except ValueError:
                return None
        return None

    @staticmethod
    def _extract_line_items(lines: List[str]) -> List[LineItemSchema]:
        items = []
        item_regex = re.compile(r'^(.*?)\s+(\d+(?:\.\d+)?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$')
        for line in lines:
            m = item_regex.match(line)
            if m:
                desc = m.group(1).strip()
                try:
                    qty = float(m.group(2))
                    unit_p = float(m.group(3).replace(",", ""))
                    amt = float(m.group(4).replace(",", ""))
                    items.append(LineItemSchema(
                        description=desc,
                        quantity=qty,
                        unit_price=unit_p,
                        amount=amt
                    ))
                except ValueError:
                    continue
        return items
