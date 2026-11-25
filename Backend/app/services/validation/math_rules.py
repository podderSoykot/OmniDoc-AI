from typing import List, Tuple
from app.models.schemas import InvoiceExtractionSchema

class MathValidationRules:
    TOLERANCE = 0.05

    @staticmethod
    def validate_totals(data: InvoiceExtractionSchema) -> Tuple[List[str], List[str]]:
        """
        Validates mathematical consistency of subtotal, tax, and total.
        Returns: (errors, warnings)
        """
        errors = []
        warnings = []

        if data.total is not None and data.total < 0:
            errors.append(f"Total amount cannot be negative: {data.total}")

        if data.subtotal is not None and data.subtotal < 0:
            errors.append(f"Subtotal cannot be negative: {data.subtotal}")

        # Check: subtotal + tax ~= total
        if data.subtotal is not None and data.tax is not None and data.total is not None:
            expected_total = round(data.subtotal + data.tax, 2)
            diff = abs(expected_total - data.total)
            if diff > MathValidationRules.TOLERANCE:
                errors.append(
                    f"Calculation mismatch: Subtotal ({data.subtotal}) + Tax ({data.tax}) = {expected_total}, but Total is {data.total} (Diff: {round(diff, 2)})"
                )

        # Check line items sum ~= subtotal
        if data.line_items and data.subtotal is not None:
            calc_subtotal = round(sum(item.amount for item in data.line_items), 2)
            diff = abs(calc_subtotal - data.subtotal)
            if diff > MathValidationRules.TOLERANCE:
                errors.append(
                    f"Line items sum ({calc_subtotal}) does not match subtotal ({data.subtotal})"
                )

        # Check each line item: qty * unit_price ~= amount
        for idx, item in enumerate(data.line_items, 1):
            if item.quantity > 0 and item.unit_price > 0:
                expected_amt = round(item.quantity * item.unit_price, 2)
                diff = abs(expected_amt - item.amount)
                if diff > MathValidationRules.TOLERANCE:
                    warnings.append(
                        f"Line item #{idx} ('{item.description}'): Quantity ({item.quantity}) * Unit Price ({item.unit_price}) = {expected_amt}, but Amount is {item.amount}"
                    )

        return errors, warnings
