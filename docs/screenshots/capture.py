import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

output_dir = Path("docs/screenshots")
output_dir.mkdir(parents=True, exist_ok=True)

with open(output_dir / "auth.json", "r") as f:
    auth_data = json.load(f)

token = auth_data["access_token"]
user_str = json.dumps(auth_data["user"])

pages_to_capture = [
    {
        "url": "http://localhost:3000/login",
        "filename": "01_login_page.png",
        "auth": False
    },
    {
        "url": "http://localhost:3000/",
        "filename": "02_dashboard_overview.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/analytics",
        "filename": "03_analytics_dashboard.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/review-queue",
        "filename": "04_review_queue.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/upload",
        "filename": "05_batch_upload_dropzone.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/upload/queue",
        "filename": "06_processing_queue.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/upload/failed",
        "filename": "07_failed_retries_hub.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/verification",
        "filename": "08_cross_verification.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/documents/9455ce0c-0586-4e16-8164-76a6dc01c343",
        "filename": "09_financial_visualizer.png",
        "auth": True
    },
    {
        "url": "http://localhost:3000/documents/799b5126-5835-48f6-988c-7206ad27b557",
        "filename": "10_document_invoice_viewer.png",
        "auth": True
    }
]

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/google-chrome",
        headless=True,
        args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
    )
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        device_scale_factor=2
    )

    for item in pages_to_capture:
        page = context.new_page()
        print(f"Navigating to {item['url']}...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")

        if item["auth"]:
            # Set localStorage tokens
            page.evaluate(f"""() => {{
                localStorage.setItem('omnidoc_token', '{token}');
                localStorage.setItem('omnidoc_user', '{user_str}');
            }}""")
            page.goto(item["url"], wait_until="networkidle")
        else:
            page.goto(item["url"], wait_until="networkidle")

        time.sleep(2) # Allow animations and chart rendering
        screenshot_path = output_dir / item["filename"]
        page.screenshot(path=str(screenshot_path), full_page=False)
        print(f"Saved: {screenshot_path}")
        page.close()

    browser.close()
print("All screenshots successfully captured!")
