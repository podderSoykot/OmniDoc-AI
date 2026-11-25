import os
from pathlib import Path
from typing import Tuple

class FileDetector:
    SUPPORTED_EXTENSIONS = {
        ".pdf": "pdf",
        ".png": "image",
        ".jpg": "image",
        ".jpeg": "image",
        ".tiff": "image",
        ".tif": "image",
        ".xlsx": "excel",
        ".xls": "excel",
        ".csv": "csv",
    }

    @staticmethod
    def detect_and_validate(file_path: Path) -> Tuple[bool, str, str]:
        """
        Validates file existence, format, and checks for corruption.
        Returns: (is_valid, file_type, error_message)
        """
        if not file_path.exists():
            return False, "unknown", "File does not exist."

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "unknown", "File is empty (0 bytes)."

        ext = file_path.suffix.lower()
        if ext not in FileDetector.SUPPORTED_EXTENSIONS:
            return False, "unsupported", f"Unsupported extension: {ext}"

        file_type = FileDetector.SUPPORTED_EXTENSIONS[ext]

        # Check basic file corruption headers
        try:
            with open(file_path, "rb") as f:
                header = f.read(16)

            if file_type == "pdf" and not header.startswith(b"%PDF"):
                return False, "pdf", "Corrupted or invalid PDF header."
            
            if file_type == "image":
                from PIL import Image
                with Image.open(file_path) as img:
                    img.verify()

            if file_type == "excel" and ext == ".xlsx" and not header.startswith(b"PK"):
                return False, "excel", "Invalid or corrupted XLSX file (missing zip magic)."

        except Exception as e:
            return False, file_type, f"Corrupted file detected: {str(e)}"

        return True, file_type, ""
