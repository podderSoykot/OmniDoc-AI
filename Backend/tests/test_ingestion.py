import pytest
from pathlib import Path
from app.services.ingestion.file_detector import FileDetector
from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.excel_parser import ExcelParser
from app.services.ingestion.processor import DocumentIngestionProcessor

SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"

def test_file_detector_valid_and_corrupt():
    valid_pdf = SAMPLE_DIR / "valid_invoice.pdf"
    corrupt_pdf = SAMPLE_DIR / "corrupted_file.pdf"

    is_valid, ftype, err = FileDetector.detect_and_validate(valid_pdf)
    assert is_valid is True
    assert ftype == "pdf"

    is_valid_c, _, err_c = FileDetector.detect_and_validate(corrupt_pdf)
    assert is_valid_c is False
    assert "Corrupted" in err_c or "invalid" in err_c

def test_pdf_parsing():
    valid_pdf = SAMPLE_DIR / "valid_invoice.pdf"
    res = PDFParser.parse_pdf(valid_pdf)
    assert res["page_count"] >= 1
    assert "INV-2026-001" in res["text"]
    assert "Acme Industrial Supply" in res["text"]

def test_excel_parsing():
    ledger = SAMPLE_DIR / "accounting_ledger.xlsx"
    res = ExcelParser.parse_spreadsheet(ledger)
    assert "Sheet1" in res["sheets"]
    assert len(res["sheets"]["Sheet1"]) == 3
    assert "Acme Industrial Supply" in res["text"]

def test_ingestion_processor_pipeline():
    valid_pdf = SAMPLE_DIR / "valid_invoice.pdf"
    res = DocumentIngestionProcessor.process_document(valid_pdf)
    assert res["file_type"] == "pdf"
    assert "INV-2026-001" in res["raw_text"]
