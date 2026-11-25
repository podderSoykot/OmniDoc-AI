import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from app.main import app

client = TestClient(app)
SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_upload_and_pipeline_flow():
    pdf_path = SAMPLE_DIR / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post("/api/v1/documents/upload", files={"files": ("valid_invoice.pdf", f, "application/pdf")})

    assert res.status_code == 200
    data = res.json()
    assert data["uploaded_count"] == 1
    job_id = data["jobs"][0]["job_id"]
    doc_id = data["jobs"][0]["document_id"]

    # Check job status
    job_res = client.get(f"/api/v1/jobs/{job_id}/status")
    assert job_res.status_code == 200

    # Retrieve document detail
    doc_res = client.get(f"/api/v1/documents/{doc_id}")
    assert doc_res.status_code == 200
    assert doc_res.json()["filename"] == "valid_invoice.pdf"
