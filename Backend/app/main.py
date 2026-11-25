import time
import uuid
from fastapi import FastAPI, Request, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.logging_config import setup_logging, logger
from app.api.v1 import documents, jobs, verification, search, auth

# Initialize structured logging
setup_logging()

# Create database tables (Alembic handles migrations, create_all ensures baseline tables)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise AI-Powered Document Intelligence & Verification System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request Tracing & Structured Logging Middleware
@app.middleware("http")
async def request_tracing_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.perf_counter()

    # Attach request_id to state
    request.state.request_id = request_id

    try:
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        
        # Log request summary
        logger.info(
            f"[{request.method}] {request.url.path} -> {response.status_code} ({duration_ms}ms) [req_id={request_id}]"
        )
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"Unhandled exception on [{request.method}] {request.url.path} after {duration_ms}ms [req_id={request_id}]: {exc}",
            exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "request_id": request_id},
            headers={"X-Request-ID": request_id}
        )

# CORS Middleware with explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Total-Count", "X-Page", "X-Page-Size", "X-Total-Pages"]
)

# Register API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs.router, prefix=settings.API_V1_PREFIX)
app.include_router(verification.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check probing database and Tesseract OCR availability.
    """
    # 1. Database check
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Tesseract OCR check
    ocr_status = "available"
    tesseract_version = "unknown"
    try:
        import pytesseract
        tesseract_version = str(pytesseract.get_tesseract_version())
    except Exception as e:
        ocr_status = f"unavailable: {str(e)}"

    is_healthy = db_status == "connected" and ocr_status == "available"
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "service": settings.PROJECT_NAME,
            "version": "1.0.0",
            "components": {
                "database": db_status,
                "tesseract_ocr": {
                    "status": ocr_status,
                    "version": tesseract_version
                }
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
