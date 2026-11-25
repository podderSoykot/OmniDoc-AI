import { DocumentItem, DocumentDetail, JobStatus, CrossVerifyResponse, StructuredInvoiceData, PaginatedDocuments, SignedUrlInfo } from './types';
import { AuthStorage } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, backoff = 500): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // If rate limited or server error, retry
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = AuthStorage.getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetchWithRetry(url, { ...options, headers });

  // Handle 401 Unauthorized: Attempt token refresh
  if (res.status === 401) {
    const refreshToken = AuthStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          AuthStorage.updateAccessToken(data.access_token);
          headers.set('Authorization', `Bearer ${data.access_token}`);
          // Retry original request with fresh token
          res = await fetchWithRetry(url, { ...options, headers });
          return res;
        }
      } catch (e) {
        console.warn('Token refresh failed:', e);
      }
    }

    // Refresh token expired or failed -> clear session
    AuthStorage.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
      window.location.href = '/login?expired=true';
    }
  }

  return res;
}

export const api = {
  // --- Authentication Endpoints ---
  async signup(email: string, password: string, fullName?: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
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
    AuthStorage.setAuth(data.access_token, data.refresh_token, data.user);
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
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
    AuthStorage.setAuth(data.access_token, data.refresh_token, data.user);
    return data;
  },

  async getMe(): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/auth/me`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  logout() {
    AuthStorage.clear();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {}
      window.location.replace('/login');
    }
  },

  // --- Multi-Tenant Document Operations ---
  async listDocuments(query = '', status = '', fileType = '', page = 1, pageSize = 50): Promise<DocumentItem[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('review_status', status);
    if (fileType) params.append('file_type', fileType);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const url = query ? `${API_BASE}/search?${params.toString()}` : `${API_BASE}/documents?${params.toString()}`;
    const res = await fetchWithAuth(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch documents');
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || [];
  },

  async listDocumentsPaginated(page = 1, pageSize = 20, query = '', status = '', fileType = ''): Promise<PaginatedDocuments> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('review_status', status);
    if (fileType) params.append('file_type', fileType);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    params.append('paginate', 'true');

    const url = query ? `${API_BASE}/search?${params.toString()}` : `${API_BASE}/documents?${params.toString()}`;
    const res = await fetchWithAuth(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch paginated documents');
    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(data.length / pageSize) || 1
      };
    }
    return data;
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await fetchWithAuth(`${API_BASE}/documents/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async getSignedUrl(id: string): Promise<SignedUrlInfo> {
    const res = await fetchWithAuth(`${API_BASE}/documents/${id}/signed-url`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to generate signed document URL');
    return res.json();
  },

  async uploadDocuments(files: File[]): Promise<{ uploaded_count: number; jobs: { document_id: string; job_id: string; filename: string }[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetchWithAuth(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const res = await fetchWithAuth(`${API_BASE}/jobs/${jobId}/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  },

  async cancelJob(jobId: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/jobs/${jobId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel job');
    return res.json();
  },

  async getDeadLetterJobs(): Promise<any[]> {
    const res = await fetchWithAuth(`${API_BASE}/jobs/dead-letter`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch dead-letter jobs');
    return res.json();
  },

  async saveCorrection(docId: string, structuredData: StructuredInvoiceData): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/documents/${docId}/corrections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structured_data: structuredData, modified_by: 'reviewer' }),
    });
    if (!res.ok) throw new Error('Failed to save corrections');
    return res.json();
  },

  async crossVerify(sourceDocId: string, targetDocId: string): Promise<CrossVerifyResponse> {
    const res = await fetchWithAuth(`${API_BASE}/verification/cross-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_document_id: sourceDocId, target_document_id: targetDocId }),
    });
    if (!res.ok) throw new Error('Cross-verification failed');
    return res.json();
  },

  async retryJob(docId: string): Promise<{ message: string; job_id: string }> {
    const res = await fetchWithAuth(`${API_BASE}/jobs/${docId}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Retry failed');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<{ message: string; id: string }> {
    const res = await fetchWithAuth(`${API_BASE}/documents/${docId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async bulkDeleteDocuments(docIds: string[]): Promise<{ deleted_count: number; document_ids: string[] }> {
    const res = await fetchWithAuth(`${API_BASE}/documents/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: docIds }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete documents');
    return res.json();
  },

  async getAuditLogs(docId: string): Promise<any[]> {
    const res = await fetchWithAuth(`${API_BASE}/documents/${docId}/audit-logs`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getVerificationHistory(limit: number = 20): Promise<any[]> {
    const res = await fetchWithAuth(`${API_BASE}/verification/history?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch verification history');
    return res.json();
  }
};
