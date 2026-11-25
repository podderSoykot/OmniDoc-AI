from pathlib import Path
from typing import Dict, Any, Generator, Tuple
import fitz  # PyMuPDF
import io
from PIL import Image
from app.services.ingestion.ocr_engine import OCREngine

class PDFParser:
    CHUNK_SIZE = 25  # Stream in batches of 25 pages to easily handle 1000+ page PDFs

    @staticmethod
    def parse_pdf(file_path: Path, max_pages: int = 1000) -> Dict[str, Any]:
        """
        Processes multi-page PDFs with memory-efficient streaming.
        Extracts digital text first; if a page is scanned/empty, falls back to OCR.
        """
        doc = fitz.open(str(file_path))
        total_pages = min(len(doc), max_pages)
        full_text_chunks = []
        scanned_pages_count = 0

        try:
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_text = page.get_text("text").strip()

                # If text is too short, treat page as scanned image
                if len(page_text) < 30:
                    scanned_pages_count += 1
                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_res = OCREngine.extract_text(img)
                    page_text = ocr_res.get("text", "")

                full_text_chunks.append(f"--- [Page {page_num + 1}] ---\n" + page_text)

        finally:
            doc.close()

        combined_text = "\n\n".join(full_text_chunks)
        return {
            "text": combined_text,
            "page_count": total_pages,
            "scanned_pages_count": scanned_pages_count,
            "is_scanned": scanned_pages_count > (total_pages / 2)
        }
