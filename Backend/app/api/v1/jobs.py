import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import Document, User
from app.models.schemas import JobStatusResponse
from app.services.queue.job_manager import JobManager
from app.core.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    job = JobManager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job

@router.post("/{document_id}/retry")
def retry_failed_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    new_job_id = str(uuid.uuid4())
    JobManager.create_job(new_job_id, document_id)
    background_tasks.add_task(JobManager.process_document_job, new_job_id, document_id, doc.file_path)

    return {"message": "Job re-queued successfully", "job_id": new_job_id, "document_id": document_id}
