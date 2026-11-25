import time
from typing import Dict, Any, Tuple
from app.models.schemas import InvoiceExtractionSchema
from app.services.extraction.llm_client import LLMClient

class ExtractionOrchestrator:
    @staticmethod
    async def extract(raw_text: str) -> Tuple[InvoiceExtractionSchema, Dict[str, float], float]:
        """
        Coordinates extraction and computes field-level confidence scores.
        Returns: (extracted_data, confidence_scores, latency_ms)
        """
        start_time = time.perf_counter()
        data = await LLMClient.extract_structured_data(raw_text)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Compute field confidence scores based on field presence and structure
        confidences = {
            "invoice_number": 0.95 if data.invoice_number else 0.0,
            "invoice_date": 0.90 if data.invoice_date else 0.0,
            "supplier_name": 0.88 if data.supplier_name else 0.0,
            "customer_name": 0.85 if data.customer_name else 0.0,
            "subtotal": 0.95 if data.subtotal is not None else 0.0,
            "tax": 0.92 if data.tax is not None else 0.0,
            "total": 0.98 if data.total is not None else 0.0,
            "currency": 0.90 if data.currency else 0.0,
            "line_items": 0.92 if data.line_items else 0.5
        }

        return data, confidences, latency_ms
