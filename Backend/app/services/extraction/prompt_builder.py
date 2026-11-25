class PromptBuilder:
    @staticmethod
    def build_invoice_extraction_prompt(raw_text: str) -> str:
        return f"""You are an expert financial document intelligence system.
Extract the structured invoice or receipt details from the provided document text.

CRITICAL INSTRUCTIONS:
1. Do NOT invent, assume, or hallucinate values.
2. If a field is not present or uncertain, return null.
3. Output MUST strictly be valid JSON matching this schema:
{{
  "invoice_number": string or null,
  "invoice_date": "YYYY-MM-DD" or null,
  "supplier_name": string or null,
  "customer_name": string or null,
  "subtotal": float or null,
  "tax": float or null,
  "total": float or null,
  "currency": string (e.g. "USD", "EUR", "$") or null,
  "line_items": [
    {{
      "description": string,
      "quantity": float,
      "unit_price": float,
      "amount": float
    }}
  ]
}}

DOCUMENT TEXT:
\"\"\"
{raw_text[:12000]}
\"\"\"

Return ONLY the raw JSON object without markdown formatting or code fences."""
