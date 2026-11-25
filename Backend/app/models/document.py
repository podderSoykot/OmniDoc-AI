import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, 
    Text, JSON, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Multi-tenant document ownership
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    cross_verifications = relationship("CrossVerification", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(32), nullable=False)  # pdf, image, excel, csv
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    status = Column(String(32), default="pending", index=True)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")
    extraction = relationship("DocumentExtraction", back_populates="document", uselist=False, cascade="all, delete-orphan")
    validation = relationship("ValidationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), unique=True)
    raw_text = Column(Text, nullable=True)
    structured_data = Column(JSON, nullable=True)
    confidence_scores = Column(JSON, nullable=True)
    processing_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="extraction")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), unique=True)
    is_valid = Column(Boolean, default=False)
    review_status = Column(String(32), default="PENDING")  # PASSED, WARNING, NEEDS_MANUAL_REVIEW, FAILED
    math_errors = Column(JSON, default=list)
    business_errors = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="validation")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"))
    field_name = Column(String(128), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    modified_by = Column(String(64), default="user")
    modified_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="audit_logs")

class CrossVerification(Base):
    __tablename__ = "cross_verifications"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    source_doc_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"))
    target_doc_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"))
    verification_type = Column(String(32), nullable=False)  # pdf_pdf or pdf_excel
    match_score = Column(Float, default=0.0)
    status = Column(String(32), default="MATCHED")  # MATCHED, PARTIAL_MATCH, MISMATCHED
    discrepancies = Column(JSON, default=list)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="cross_verifications")
