from pathlib import Path
from typing import Dict, Any, List
import pandas as pd

class ExcelParser:
    @staticmethod
    def parse_spreadsheet(file_path: Path) -> Dict[str, Any]:
        """
        Parses XLSX, XLS, and CSV files, extracts multi-sheet content,
        normalizes headers, and converts rows to structured representations.
        """
        ext = file_path.suffix.lower()
        sheets_data: Dict[str, List[Dict[str, Any]]] = {}
        formatted_text_chunks = []

        if ext == ".csv":
            df = pd.read_csv(file_path, keep_default_na=False)
            df.columns = [str(c).strip() for c in df.columns]
            records = df.to_dict(orient="records")
            sheets_data["Sheet1"] = records
            formatted_text_chunks.append("--- [Sheet: Sheet1] ---")
            formatted_text_chunks.append(df.to_string(index=False))
        else:
            excel_file = pd.ExcelFile(file_path)
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name, keep_default_na=False)
                df.columns = [str(c).strip() for c in df.columns]
                records = df.to_dict(orient="records")
                sheets_data[sheet_name] = records
                formatted_text_chunks.append(f"--- [Sheet: {sheet_name}] ---")
                formatted_text_chunks.append(df.to_string(index=False))

        return {
            "text": "\n\n".join(formatted_text_chunks),
            "sheets": sheets_data,
            "page_count": len(sheets_data)
        }
