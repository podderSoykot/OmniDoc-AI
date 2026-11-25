export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface StructuredInvoiceData {
  invoice_number?: string | null;
  invoice_date?: string | null;
  supplier_name?: string | null;
  customer_name?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  currency?: string | null;
  line_items: LineItem[];
}

export interface ValidationReport {
  is_valid: boolean;
  review_status: 'PASSED' | 'WARNING' | 'NEEDS_MANUAL_REVIEW' | 'FAILED' | 'PENDING';
  math_errors: string[];
  business_errors: string[];
  warnings: string[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  page_count: number;
  status: string;
  error_message?: string | null;
  review_status?: string;
  total?: number | null;
  currency?: string | null;
  supplier_name?: string | null;
  created_at: string;
}

export interface PaginatedDocuments {
  items: DocumentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SignedUrlInfo {
  document_id: string;
  preview_url: string;
  download_url: string;
  expires_in_seconds: number;
}

export interface DocumentDetail extends DocumentItem {
  error_message?: string | null;
  structured_data?: StructuredInvoiceData | null;
  sheets?: Record<string, Array<Record<string, any>>> | null;
  is_spreadsheet?: boolean;
  confidence_scores?: Record<string, number> | null;
  validation?: ValidationReport | null;
  raw_text?: string | null;
}

export interface JobStatus {
  job_id: string;
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  current_step: string;
  error?: string | null;
}

export interface DiscrepancyItem {
  field: string;
  source_value: any;
  target_value: any;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
}

export interface CrossVerifyResponse {
  id: string;
  source_doc_id: string;
  target_doc_id: string;
  verification_type: string;
  match_score: number;
  status: 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCHED';
  discrepancies: DiscrepancyItem[];
  summary: string;
}
