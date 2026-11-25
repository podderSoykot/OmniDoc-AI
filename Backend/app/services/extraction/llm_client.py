import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging_config import logger
from app.models.schemas import InvoiceExtractionSchema
from app.services.extraction.prompt_builder import PromptBuilder
from app.services.extraction.heuristic_extractor import HeuristicExtractor

class LLMClient:
    @staticmethod
    async def extract_structured_data(raw_text: str) -> InvoiceExtractionSchema:
        """
        Sends raw text to LLM API (Gemini or OpenAI).
        Falls back automatically to heuristic engine if API key is absent or request fails.
        """
        prompt = PromptBuilder.build_invoice_extraction_prompt(raw_text)

        # Check if Gemini key is available
        if settings.GEMINI_API_KEY:
            try:
                return await LLMClient._call_gemini_api(prompt)
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}), falling back to heuristic engine.")

        # Check if OpenAI key is available
        if settings.OPENAI_API_KEY:
            try:
                return await LLMClient._call_openai_api(prompt)
            except Exception as e:
                logger.warning(f"OpenAI API call failed ({e}), falling back to heuristic engine.")

        # Offline / Heuristic Fallback
        logger.info("Using heuristic rule-based extraction engine.")
        return HeuristicExtractor.extract_from_text(raw_text)

    @staticmethod
    async def _call_gemini_api(prompt: str) -> InvoiceExtractionSchema:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.0, "response_mime_type": "application/json"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_json)
            return InvoiceExtractionSchema(**parsed)

    @staticmethod
    async def _call_openai_api(prompt: str) -> InvoiceExtractionSchema:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_json = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_json)
            return InvoiceExtractionSchema(**parsed)
