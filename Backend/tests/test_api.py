from pathlib import Path

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "components" in data
    assert "database" in data["components"]
    assert "tesseract_ocr" in data["components"]

def test_upload_and_pipeline_flow(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["uploaded_count"] == 1
    job_id = data["jobs"][0]["job_id"]
    doc_id = data["jobs"][0]["document_id"]

    # Check job status
    job_res = client.get(f"/api/v1/jobs/{job_id}/status", headers=headers)
    assert job_res.status_code == 200

    # Retrieve document detail
    doc_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert doc_res.status_code == 200
    assert doc_res.json()["filename"] == "valid_invoice.pdf"
