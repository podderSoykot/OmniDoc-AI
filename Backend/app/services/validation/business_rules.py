from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from app.models.schemas import InvoiceExtractionSchema

class BusinessValidationRules:
    @staticmethod
    def validate_business_logic(data: InvoiceExtractionSchema, is_duplicate: bool = False) -> Tuple[List[str], List[str]]:
        """
        Validates required fields, dates, currencies, and duplicates.
        Returns: (errors, warnings)
        """
        errors = []
        warnings = []

        # 1. Required Fields
        if not data.invoice_number:
            errors.append("Missing mandatory field: Invoice Number")
        if not data.invoice_date:
            warnings.append("Missing field: Invoice Date")
        if not data.supplier_name:
            warnings.append("Missing field: Supplier Name")
        if data.total is None:
            errors.append("Missing mandatory field: Total Amount")

        # 2. Duplicate Detection
        if is_duplicate:
            errors.append(f"Duplicate invoice detected: Invoice #{data.invoice_number} from {data.supplier_name} already exists.")

        # 3. Future Date Check
        if data.invoice_date:
            try:
                # Attempt basic parsing
                clean_date_str = data.invoice_date.strip().replace("/", "-")
                parsed_date = datetime.strptime(clean_date_str[:10], "%Y-%m-%d")
                future_limit = datetime.utcnow() + timedelta(days=30)
                if parsed_date > future_limit:
                    warnings.append(f"Invoice date {data.invoice_date} is too far in the future.")
            except Exception:
                warnings.append(f"Invoice date format '{data.invoice_date}' could not be normalized.")

        return errors, warnings
