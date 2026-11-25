import { DocumentItem, DocumentDetail, JobStatus, CrossVerifyResponse, StructuredInvoiceData } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = {
  async listDocuments(query = '', status = '', fileType = ''): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('review_status', status);
    if (fileType) params.append('file_type', fileType);

    const url = query ? `${API_BASE}/search?${params.toString()}` : `${API_BASE}/documents?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async uploadDocuments(files: File[]): Promise<{ uploaded_count: number; jobs: { document_id: string; job_id: string; filename: string }[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  },

  async saveCorrection(docId: string, structuredData: StructuredInvoiceData): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/corrections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structured_data: structuredData, modified_by: 'reviewer' }),
    });
    if (!res.ok) throw new Error('Failed to save corrections');
    return res.json();
  },

  async crossVerify(sourceDocId: string, targetDocId: string): Promise<CrossVerifyResponse> {
    const res = await fetch(`${API_BASE}/verification/cross-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_document_id: sourceDocId, target_document_id: targetDocId }),
    });
    if (!res.ok) throw new Error('Cross-verification failed');
    return res.json();
  },

  async retryJob(docId: string): Promise<{ message: string; job_id: string }> {
    const res = await fetch(`${API_BASE}/jobs/${docId}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Retry failed');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async bulkDeleteDocuments(docIds: string[]): Promise<{ deleted_count: number; document_ids: string[] }> {
    const res = await fetch(`${API_BASE}/documents/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: docIds }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete documents');
    return res.json();
  },

  async getAuditLogs(docId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents/${docId}/audit-logs`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getVerificationHistory(limit: number = 20): Promise<any[]> {
    const res = await fetch(`${API_BASE}/verification/history?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch verification history');
    return res.json();
  }
};
