from pathlib import Path
from typing import Dict, Any, Union
import pytesseract
import numpy as np
from PIL import Image
from app.services.ingestion.image_preprocessor import ImagePreprocessor

class OCREngine:
    @staticmethod
    def extract_text(image_input: Union[Path, str, Image.Image, np.ndarray]) -> Dict[str, Any]:
        """
        Runs image preprocessing and performs OCR via Tesseract.
        Returns extracted text and basic word confidence metrics.
        """
        if isinstance(image_input, Path):
            image_input = str(image_input)

        try:
            processed_img = ImagePreprocessor.preprocess_image(image_input)
            
            # Tesseract config for invoice/tabular document OCR
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(processed_img, config=custom_config)
            
            # Confidence score calculation
            data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_conf = (sum(confidences) / len(confidences)) / 100.0 if confidences else 0.85

            return {
                "text": text.strip(),
                "confidence": round(avg_conf, 3),
                "is_ocr": True
            }
        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "error": f"OCR processing failed: {str(e)}",
                "is_ocr": True
            }
