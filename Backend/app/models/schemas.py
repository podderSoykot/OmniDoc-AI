from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class LineItemSchema(BaseModel):
    description: str = Field(..., description="Description of the product or service")
    quantity: float = Field(default=1.0, description="Quantity of items")
    unit_price: float = Field(default=0.0, description="Price per unit")
    amount: float = Field(default=0.0, description="Total amount for this line item")

class InvoiceExtractionSchema(BaseModel):
    invoice_number: Optional[str] = Field(None, description="Invoice or receipt number")
    invoice_date: Optional[str] = Field(None, description="Invoice date in YYYY-MM-DD or original format")
    supplier_name: Optional[str] = Field(None, description="Supplier or vendor company name")
    customer_name: Optional[str] = Field(None, description="Customer or billed client name")
    subtotal: Optional[float] = Field(None, description="Subtotal amount before tax")
    tax: Optional[float] = Field(None, description="Tax amount")
    total: Optional[float] = Field(None, description="Grand total amount")
    currency: Optional[str] = Field(None, description="Currency symbol or code (e.g. USD, EUR)")
    line_items: List[LineItemSchema] = Field(default_factory=list, description="Extracted line items")

class ValidationReport(BaseModel):
    is_valid: bool
    review_status: str  # PASSED, WARNING, NEEDS_MANUAL_REVIEW, FAILED
    math_errors: List[str] = Field(default_factory=list)
    business_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class DocumentDetailResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    page_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    structured_data: Optional[Dict[str, Any]] = None
    confidence_scores: Optional[Dict[str, float]] = None
    validation: Optional[ValidationReport] = None
    raw_text: Optional[str] = None

class DocumentListItemResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    page_count: int
    status: str
    review_status: Optional[str] = None
    total: Optional[float] = None
    currency: Optional[str] = None
    supplier_name: Optional[str] = None
    created_at: datetime

class JobStatusResponse(BaseModel):
    job_id: str
    document_id: str
    status: str  # pending, processing, completed, failed
    progress_percentage: int
    current_step: str
    error: Optional[str] = None

class ManualCorrectionRequest(BaseModel):
    structured_data: Dict[str, Any]
    modified_by: str = "user"

class CrossVerifyRequest(BaseModel):
    source_document_id: str
    target_document_id: str
    verification_type: Optional[str] = None  # auto-detected if not passed

class DiscrepancyItem(BaseModel):
    field: str
    source_value: Any
    target_value: Any
    severity: str  # CRITICAL, WARNING, INFO
    message: str

class CrossVerifyResponse(BaseModel):
    id: str
    source_doc_id: str
    target_doc_id: str
    verification_type: str
    match_score: float
    status: str  # MATCHED, PARTIAL_MATCH, MISMATCHED
    discrepancies: List[DiscrepancyItem]
    summary: str
