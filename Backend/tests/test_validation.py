import pytest
from app.models.schemas import InvoiceExtractionSchema, LineItemSchema
from app.services.validation.validator import DocumentValidator
from app.services.extraction.heuristic_extractor import HeuristicExtractor

def test_heuristic_extraction():
    sample_text = """
    Invoice Number: INV-98765
    Date: 2026-11-15
    Supplier: TechCorp LLC
    Customer: Global Enterprises
    
    Cloud Hosting 1 100.00 100.00
    Database 1 50.00 50.00
    
    Subtotal: $150.00
    Tax: $15.00
    Total: $165.00
    """
    extracted = HeuristicExtractor.extract_from_text(sample_text)
    assert extracted.invoice_number == "INV-98765"
    assert extracted.total == 165.00
    assert extracted.subtotal == 150.00
    assert extracted.tax == 15.00
    assert len(extracted.line_items) == 2

def test_validation_rules_pass():
    item = LineItemSchema(description="Widget A", quantity=2, unit_price=10.0, amount=20.0)
    data = InvoiceExtractionSchema(
        invoice_number="INV-101",
        invoice_date="2026-11-20",
        supplier_name="Vendor A",
        subtotal=20.0,
        tax=2.0,
        total=22.0,
        line_items=[item]
    )
    report = DocumentValidator.validate(data)
    assert report.is_valid is True
    assert report.review_status == "PASSED"
    assert len(report.math_errors) == 0

def test_validation_math_mismatch():
    data = InvoiceExtractionSchema(
        invoice_number="INV-102",
        invoice_date="2026-11-20",
        supplier_name="Vendor B",
        subtotal=100.0,
        tax=10.0,
        total=150.0  # Mismatch: 100 + 10 != 150
    )
    report = DocumentValidator.validate(data)
    assert report.is_valid is False
    assert report.review_status == "NEEDS_MANUAL_REVIEW"
    assert len(report.math_errors) > 0
