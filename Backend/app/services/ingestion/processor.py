from pathlib import Path
from typing import Dict, Any
from app.services.ingestion.file_detector import FileDetector
from app.services.ingestion.pdf_parser import PDFParser
from app.services.ingestion.ocr_engine import OCREngine
from app.services.ingestion.excel_parser import ExcelParser

class DocumentIngestionProcessor:
    @staticmethod
    def process_document(file_path: Path) -> Dict[str, Any]:
        """
        Coordinates detection, parsing, OCR, and normalization.
        Raises ValueError if corrupted or unsupported.
        """
        is_valid, file_type, err = FileDetector.detect_and_validate(file_path)
        if not is_valid:
            raise ValueError(f"Document ingestion failed: {err}")

        if file_type == "pdf":
            parsed = PDFParser.parse_pdf(file_path)
            return {
                "file_type": "pdf",
                "page_count": parsed["page_count"],
                "raw_text": parsed["text"],
                "is_scanned": parsed["is_scanned"],
                "sheets": None
            }
        elif file_type == "image":
            ocr_res = OCREngine.extract_text(file_path)
            return {
                "file_type": "image",
                "page_count": 1,
                "raw_text": ocr_res["text"],
                "is_scanned": True,
                "sheets": None
            }
        elif file_type in ("excel", "csv"):
            excel_res = ExcelParser.parse_spreadsheet(file_path)
            return {
                "file_type": file_type,
                "page_count": excel_res["page_count"],
                "raw_text": excel_res["text"],
                "is_scanned": False,
                "sheets": excel_res["sheets"]
            }
        else:
            raise ValueError(f"Unhandled file type: {file_type}")
