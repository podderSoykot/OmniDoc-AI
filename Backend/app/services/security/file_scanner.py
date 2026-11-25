import os
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.core.logging_config import logger

# Magic byte signatures for authorized document formats
MAGIC_NUMBERS = {
    "pdf": [b"%PDF"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "tiff": [b"II*\x00", b"MM\x00*"],
    "xlsx": [b"PK\x03\x04"],  # ZIP container
    "xls": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],  # OLE container
}

# Known executable / malicious binary signatures
EXECUTABLE_SIGNATURES = [
    b"MZ",           # Windows PE executable / DLL
    b"\x7fELF",      # Linux ELF binary
    b"\xca\xfe\xba\xbe", # Mach-O or Java class
    b"\xfe\xed\xfa\xce", # Mach-O 32-bit
    b"\xcf\xfa\xed\xfe", # Mach-O 64-bit
]

# Disallowed dangerous extensions
DISALLOWED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".bin", ".dll", ".so", 
    ".vbs", ".js", ".mjs", ".php", ".py", ".rb", ".jar", ".ps1", ".scr"
}

ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".xlsx", ".xls", ".csv"
}

class FileSecurityScanner:
    @staticmethod
    def validate_file_metadata(filename: str, file_size: int) -> None:
        """Validates filename, extension, and upload size boundaries."""
        # 1. Path Traversal & Filename Sanitization
        sanitized = Path(filename).name
        if not sanitized or sanitized != filename or ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or potentially malicious filename detected."
            )

        # 2. Check for disallowed / double extensions
        lower_name = filename.lower()
        ext = Path(filename).suffix.lower()
        if not ext or ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Check for dangerous nested extensions like file.pdf.exe
        parts = lower_name.split(".")
        if len(parts) > 2:
            for part in parts[1:-1]:
                if f".{part}" in DISALLOWED_EXTENSIONS:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Dangerous double-extension detected in upload."
                    )

        # 3. File Size Enforce
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

    @staticmethod
    def scan_file_content(file_path: Path, ext: str) -> None:
        """
        Scans file contents on disk for magic byte alignment and malware signatures.
        """
        clean_ext = ext.lstrip(".").lower()
        if clean_ext == "tif":
            clean_ext = "tiff"

        with open(file_path, "rb") as f:
            header = f.read(512)

        # Check for executable binary headers
        for sig in EXECUTABLE_SIGNATURES:
            if header.startswith(sig):
                # Remove file immediately
                try:
                    os.unlink(file_path)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security violation: Executable binary signatures detected."
                )

        # CSV is text-based: verify it doesn't contain null bytes or binary streams
        if clean_ext == "csv":
            if b"\x00" in header:
                try:
                    os.unlink(file_path)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid CSV file: Binary data/null bytes detected."
                )
            return

        # Magic byte verification for non-CSV formats
        expected_sigs = MAGIC_NUMBERS.get(clean_ext)
        if expected_sigs:
            matched = any(header.startswith(sig) for sig in expected_sigs)
            if not matched:
                try:
                    os.unlink(file_path)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File header mismatch: File extension '{ext}' does not match content magic bytes."
                )
