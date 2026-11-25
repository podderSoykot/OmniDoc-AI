import uuid
import time
from pathlib import Path
import pytest

def test_health_check_detailed(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert body["components"]["database"] == "connected"
    assert body["components"]["tesseract_ocr"]["status"] in ("available", "unavailable")

def test_auth_signup_and_login_flow(client):
    email = f"e2e_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword2026!"
    
    # 1. Signup
    signup_res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": "E2E Test User"
    })
    assert signup_res.status_code == 200
    signup_data = signup_res.json()
    assert "access_token" in signup_data
    assert "refresh_token" in signup_data
    assert signup_data["user"]["email"] == email

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data

def test_password_policy_enforcement(client):
    email = f"e2e_{uuid.uuid4().hex[:8]}@example.com"

    # Too short
    res_short = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "Pass1!"
    })
    assert res_short.status_code == 422 or res_short.status_code == 400

    # Missing special character
    res_no_sym = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "Password1234"
    })
    assert res_no_sym.status_code == 400
    assert "special character" in res_no_sym.json()["detail"].lower()

    # Missing uppercase
    res_no_upper = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": "password1234!"
    })
    assert res_no_upper.status_code == 400
    assert "uppercase" in res_no_upper.json()["detail"].lower()

def test_auth_token_refresh(client):
    email = f"e2e_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "ValidPassword2026!"
    res = client.post("/api/v1/auth/signup", json={
        "email": email,
        "password": pwd,
        "full_name": "Refresh Tester"
    })
    refresh_token = res.json()["refresh_token"]

    # Call /auth/refresh
    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()

def test_auth_me_endpoint(client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == auth_headers["email"]

def test_file_upload_security_mime_validation(client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    
    # Fake PDF containing binary executable or invalid header
    fake_pdf = b"NOT_A_REAL_PDF_HEADER_THIS_IS_CORRUPT"
    res = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"files": ("spoofed.pdf", fake_pdf, "application/pdf")}
    )
    assert res.status_code == 400
    assert "magic bytes" in res.json()["detail"].lower() or "mismatch" in res.json()["detail"].lower()

def test_file_upload_security_disallowed_extension(client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    exe_content = b"fake binary"
    res = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"files": ("malware.exe", exe_content, "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "unsupported file extension" in res.json()["detail"].lower()

def test_upload_excel_document_e2e(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    excel_path = sample_dir / "accounting_ledger.xlsx"
    with open(excel_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("accounting_ledger.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
    assert res.status_code == 200
    data = res.json()
    assert data["uploaded_count"] == 1
    doc_id = data["jobs"][0]["document_id"]

    # Verify document detail
    doc_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert doc_res.status_code == 200
    assert doc_res.json()["file_type"] in ("excel", "unknown", "spreadsheet")

def test_multi_tenant_document_isolation(client, auth_headers, sample_dir):
    user_a_headers = {"Authorization": auth_headers["Authorization"]}

    # Create User B
    user_b_res = client.post("/api/v1/auth/signup", json={
        "email": f"user_b_{uuid.uuid4().hex[:8]}@example.com",
        "password": "PasswordForUserB123!",
        "full_name": "User B"
    })
    user_b_headers = {"Authorization": f"Bearer {user_b_res.json()['access_token']}"}

    # User A uploads a document
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        upload_res = client.post(
            "/api/v1/documents/upload",
            headers=user_a_headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )
    doc_id = upload_res.json()["jobs"][0]["document_id"]

    # User B attempts to access User A's document -> 404 / 403 Forbidden
    doc_res_b = client.get(f"/api/v1/documents/{doc_id}", headers=user_b_headers)
    assert doc_res_b.status_code in (403, 404)

    # User B lists documents -> User A's document not present
    list_b = client.get("/api/v1/documents", headers=user_b_headers)
    assert list_b.status_code == 200
    doc_ids_b = [d["id"] for d in (list_b.json() if isinstance(list_b.json(), list) else list_b.json().get("items", []))]
    assert doc_id not in doc_ids_b

def test_signed_url_generation_and_access(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )
    doc_id = res.json()["jobs"][0]["document_id"]

    # Get signed URL
    signed_res = client.get(f"/api/v1/documents/{doc_id}/signed-url", headers=headers)
    assert signed_res.status_code == 200
    signed_data = signed_res.json()
    assert "preview_url" in signed_data
    assert "download_url" in signed_data

    # Access preview using signed URL without any Authorization header
    preview_path = signed_data["preview_url"]
    preview_res = client.get(preview_path)
    assert preview_res.status_code == 200
    assert "application/pdf" in preview_res.headers.get("content-type", "")

    # Access download using signed URL without Authorization header
    download_path = signed_data["download_url"]
    download_res = client.get(download_path)
    assert download_res.status_code == 200

def test_signed_url_tamper_rejection(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )
    doc_id = res.json()["jobs"][0]["document_id"]

    # Access preview with forged/tampered token
    tampered_url = f"/api/v1/documents/{doc_id}/preview?token=invalid.tampered.jwt_signature"
    tampered_res = client.get(tampered_url)
    assert tampered_res.status_code in (401, 403)

def test_manual_correction_and_audit_trail(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )
    doc_id = res.json()["jobs"][0]["document_id"]

    # Submit correction
    corr_res = client.put(
        f"/api/v1/documents/{doc_id}/corrections",
        headers=headers,
        json={
            "structured_data": {
                "invoice_number": "CORRECTED-INV-999",
                "subtotal": 500.0,
                "tax": 50.0,
                "total": 550.0,
                "line_items": []
            },
            "modified_by": "qa_auditor"
        }
    )
    assert corr_res.status_code == 200

    # Verify audit logs
    audit_res = client.get(f"/api/v1/documents/{doc_id}/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert any(log["field_name"] == "invoice_number" for log in logs)

def test_job_cancellation(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files={"files": ("valid_invoice.pdf", f, "application/pdf")}
        )
    job_id = res.json()["jobs"][0]["job_id"]

    cancel_res = client.post(f"/api/v1/jobs/{job_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

def test_dead_letter_queue_endpoint(client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}
    dlq_res = client.get("/api/v1/jobs/dead-letter", headers=headers)
    assert dlq_res.status_code == 200
    assert isinstance(dlq_res.json(), list)

def test_server_side_pagination(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Upload two documents
    pdf_path = sample_dir / "valid_invoice.pdf"
    for i in range(2):
        with open(pdf_path, "rb") as f:
            client.post(
                "/api/v1/documents/upload",
                headers=headers,
                files={"files": (f"test_doc_{i}.pdf", f, "application/pdf")}
            )

    # Test pagination response with paginate=True
    paginated_res = client.get("/api/v1/documents?page=1&page_size=1&paginate=true", headers=headers)
    assert paginated_res.status_code == 200
    data = paginated_res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert len(data["items"]) == 1

    # Check response headers
    assert "X-Total-Count" in paginated_res.headers
    assert "X-Total-Pages" in paginated_res.headers

def test_bulk_delete_documents(client, auth_headers, sample_dir):
    headers = {"Authorization": auth_headers["Authorization"]}
    pdf_path = sample_dir / "valid_invoice.pdf"
    doc_ids = []
    for i in range(2):
        with open(pdf_path, "rb") as f:
            r = client.post(
                "/api/v1/documents/upload",
                headers=headers,
                files={"files": (f"bulk_{i}.pdf", f, "application/pdf")}
            )
            doc_ids.append(r.json()["jobs"][0]["document_id"])

    del_res = client.post("/api/v1/documents/bulk-delete", headers=headers, json={"document_ids": doc_ids})
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 2
