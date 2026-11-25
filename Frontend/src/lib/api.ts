import { DocumentItem, DocumentDetail, JobStatus, CrossVerifyResponse, StructuredInvoiceData } from './types';
import { AuthStorage } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = AuthStorage.getToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- Authentication Endpoints ---
  async signup(email: string, password: string, fullName?: string): Promise<{ access_token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Signup failed' }));
      throw new Error(err.detail || 'Signup failed');
    }
    const data = await res.json();
    AuthStorage.setAuth(data.access_token, data.user);
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    AuthStorage.setAuth(data.access_token, data.user);
    return data;
  },

  async getMe(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  logout() {
    AuthStorage.clear();
  },

  // --- Multi-Tenant Document Operations ---
  async listDocuments(query = '', status = '', fileType = ''): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('review_status', status);
    if (fileType) params.append('file_type', fileType);

    const url = query ? `${API_BASE}/search?${params.toString()}` : `${API_BASE}/documents?${params.toString()}`;
    const res = await fetch(url, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async uploadDocuments(files: File[]): Promise<{ uploaded_count: number; jobs: { document_id: string; job_id: string; filename: string }[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/status`, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  },

  async saveCorrection(docId: string, structuredData: StructuredInvoiceData): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/corrections`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ structured_data: structuredData, modified_by: 'reviewer' }),
    });
    if (!res.ok) throw new Error('Failed to save corrections');
    return res.json();
  },

  async crossVerify(sourceDocId: string, targetDocId: string): Promise<CrossVerifyResponse> {
    const res = await fetch(`${API_BASE}/verification/cross-check`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ source_document_id: sourceDocId, target_document_id: targetDocId }),
    });
    if (!res.ok) throw new Error('Cross-verification failed');
    return res.json();
  },

  async retryJob(docId: string): Promise<{ message: string; job_id: string }> {
    const res = await fetch(`${API_BASE}/jobs/${docId}/retry`, { 
      method: 'POST',
      headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Retry failed');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async bulkDeleteDocuments(docIds: string[]): Promise<{ deleted_count: number; document_ids: string[] }> {
    const res = await fetch(`${API_BASE}/documents/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ document_ids: docIds }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete documents');
    return res.json();
  },

  async getAuditLogs(docId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents/${docId}/audit-logs`, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getVerificationHistory(limit: number = 20): Promise<any[]> {
    const res = await fetch(`${API_BASE}/verification/history?limit=${limit}`, { 
      headers: getAuthHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch verification history');
    return res.json();
  }
};
