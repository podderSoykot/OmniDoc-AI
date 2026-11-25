import uuid
from typing import List
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import Document, User
from app.models.schemas import JobStatusResponse, DeadLetterJobResponse
from app.services.queue.job_manager import JobManager
from app.core.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/dead-letter", response_model=List[DeadLetterJobResponse])
def get_dead_letter_queue(current_user: User = Depends(get_current_user)):
    """Returns dead-lettered jobs that exceeded maximum retries."""
    return JobManager.get_dead_letter_jobs(user_id=current_user.id)

@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    job = JobManager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, current_user: User = Depends(get_current_user)):
    """Cancels a queued or in-flight job."""
    job = JobManager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    JobManager.cancel_job(job_id)
    return {"message": f"Job {job_id} cancelled successfully", "job_id": job_id, "status": "cancelled"}

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
    JobManager.create_job(new_job_id, document_id, user_id=current_user.id)
    background_tasks.add_task(JobManager.process_document_job, new_job_id, document_id, doc.file_path)

    return {"message": "Job re-queued successfully", "job_id": new_job_id, "document_id": document_id}
