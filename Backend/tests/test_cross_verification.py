import pytest
from app.services.cross_verification.verifier import CrossVerificationOrchestrator

def test_pdf_pdf_cross_verification():
    po_data = {
        "invoice_number": "PO-100",
        "supplier_name": "Acme Tools",
        "total": 500.0,
        "subtotal": 450.0
    }
    invoice_data = {
        "invoice_number": "INV-550",
        "supplier_name": "Acme Tools Inc",
        "total": 500.0,
        "subtotal": 450.0
    }
    res = CrossVerificationOrchestrator.cross_verify("doc_po", "doc_inv", "pdf", "pdf", po_data, invoice_data)
    assert res.verification_type == "pdf_pdf"
    assert res.status == "MATCHED"
    assert res.match_score >= 80.0

def test_pdf_excel_cross_verification():
    inv_data = {
        "invoice_number": "INV-2026-001",
        "supplier_name": "Acme Industrial Supply",
        "total": 1320.0
    }
    excel_sheets = {
        "Sheet1": [
            {"TransactionID": "TX1", "InvoiceReference": "INV-2026-001", "Amount": 1320.0}
        ]
    }
    res = CrossVerificationOrchestrator.cross_verify("doc_pdf", "doc_xl", "pdf", "excel", inv_data, {}, excel_sheets)
    assert res.verification_type == "pdf_excel"
    assert res.status == "MATCHED"
    assert res.match_score == 100.0
