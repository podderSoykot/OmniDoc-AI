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

    @staticmethod
    def summarize_spreadsheet(sheets_data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Produces structural and quantitative metrics across all worksheets in a workbook.
        """
        sheet_summaries = []
        total_records = 0
        primary_metrics: Dict[str, float] = {}

        for name, rows in sheets_data.items():
            count = len(rows)
            total_records += count
            cols = list(rows[0].keys()) if rows else []
            numeric_sums: Dict[str, float] = {}

            if rows:
                for col in cols:
                    lower_col = col.lower()
                    if any(term in lower_col for term in ("total", "amount", "debit", "credit", "price", "subtotal", "tax", "balance")):
                        total_val = 0.0
                        for r in rows:
                            val = r.get(col)
                            try:
                                total_val += float(str(val).replace(",", "").replace("$", ""))
                            except (ValueError, TypeError):
                                pass
                        numeric_sums[col] = round(total_val, 2)
                        primary_metrics[f"{name}::{col}"] = round(total_val, 2)

            sheet_summaries.append({
                "sheet_name": name,
                "row_count": count,
                "columns": cols,
                "numeric_sums": numeric_sums
            })

        return {
            "total_sheets": len(sheets_data),
            "total_records": total_records,
            "sheet_summaries": sheet_summaries,
            "primary_metrics": primary_metrics
        }
