from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas import DocumentListItemResponse
from app.services.search.search_service import SearchService
from app.core.auth import get_current_user
from app.models.document import User

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=List[DocumentListItemResponse])
def search_documents(
    q: Optional[str] = Query(None, description="Search query string"),
    review_status: Optional[str] = Query(None, description="Filter by review status: PASSED, WARNING, NEEDS_MANUAL_REVIEW, FAILED"),
    file_type: Optional[str] = Query(None, description="Filter by file type: pdf, image, excel, csv"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SearchService.search_documents(
        db=db,
        query=q,
        review_status=review_status,
        file_type=file_type,
        limit=limit,
        offset=offset,
        user_id=current_user.id
    )
