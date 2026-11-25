import io
from pathlib import Path
import fitz
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

def generate_sample_dataset(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Digital PDF Invoice
    doc = fitz.open()
    page = doc.new_page()
    text = """INVOICE
Acme Industrial Supply
123 Enterprise Way, Tech City

Invoice Number: INV-2026-001
Date: 2026-11-20
Bill To: Global Logistics Inc.

Description                        Qty    Price      Total
Server Rack Mounting Kit             2    250.00     500.00
Cat6 Ethernet Cables 100m            5     50.00     250.00
Gigabit Managed Switch 24-Port       1    450.00     450.00

Subtotal: $1200.00
Tax: $120.00
Total: $1320.00
"""
    page.insert_text((50, 72), text, fontsize=11)
    doc.save(str(output_dir / "valid_invoice.pdf"))
    doc.close()

    # 2. Matching Purchase Order PDF (for PDF-PDF cross-verification)
    doc_po = fitz.open()
    page_po = doc_po.new_page()
    text_po = """PURCHASE ORDER
Global Logistics Inc.

PO Number: PO-8891
Supplier: Acme Industrial Supply
Date: 2026-11-18

Description                        Qty    Price      Total
Server Rack Mounting Kit             2    250.00     500.00
Cat6 Ethernet Cables 100m            5     50.00     250.00
Gigabit Managed Switch 24-Port       1    450.00     450.00

Subtotal: $1200.00
Tax: $120.00
Total: $1320.00
"""
    page_po.insert_text((50, 72), text_po, fontsize=11)
    doc_po.save(str(output_dir / "matching_po.pdf"))
    doc_po.close()

    # 3. Excel General Ledger (for PDF-Excel cross-verification)
    ledger_data = {
        "TransactionID": ["TXN-1001", "TXN-1002", "TXN-1003"],
        "InvoiceReference": ["INV-2026-001", "INV-2026-002", "INV-2026-003"],
        "Vendor": ["Acme Industrial Supply", "Office Depot", "AWS Cloud"],
        "Amount": [1320.00, 345.50, 2100.00],
        "Status": ["Approved", "Paid", "Pending"]
    }
    df_ledger = pd.DataFrame(ledger_data)
    df_ledger.to_excel(output_dir / "accounting_ledger.xlsx", index=False)

    # 4. Scanned Receipt Image (PNG)
    img = Image.new("RGB", (600, 450), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((30, 30), "RECEIPT", fill=(0, 0, 0))
    draw.text((30, 60), "Starbucks Coffee", fill=(0, 0, 0))
    draw.text((30, 90), "Receipt Number: REC-7741", fill=(0, 0, 0))
    draw.text((30, 120), "Date: 2026-11-22", fill=(0, 0, 0))
    draw.text((30, 160), "Caramel Macchiato     2    5.50    11.00", fill=(0, 0, 0))
    draw.text((30, 190), "Croissant              1    4.00     4.00", fill=(0, 0, 0))
    draw.text((30, 240), "Subtotal: $15.00", fill=(0, 0, 0))
    draw.text((30, 270), "Tax: $1.50", fill=(0, 0, 0))
    draw.text((30, 300), "Total: $16.50", fill=(0, 0, 0))
    img.save(str(output_dir / "scanned_receipt.png"))

    # 5. Math Mismatch Invoice (for validation review testing)
    doc_err = fitz.open()
    page_err = doc_err.new_page()
    text_err = """INVOICE
Apex Hardware
Invoice Number: INV-ERR-999
Date: 2026-11-21
Total: $999.00
Subtotal: $500.00
Tax: $50.00
"""
    page_err.insert_text((50, 72), text_err, fontsize=11)
    doc_err.save(str(output_dir / "math_mismatch_invoice.pdf"))
    doc_err.close()

    # 6. Corrupted PDF
    with open(output_dir / "corrupted_file.pdf", "wb") as f:
        f.write(b"NOT_A_PDF_HEADER_JUST_GARBAGE_BYTES")

if __name__ == "__main__":
    generate_sample_dataset(Path(__file__).parent)
    print("Sample dataset generated successfully.")
