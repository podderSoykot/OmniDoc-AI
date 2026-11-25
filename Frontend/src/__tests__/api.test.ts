import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../lib/api';
import { AuthStorage } from '../lib/auth';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('includes bearer token in requests', async () => {
    AuthStorage.setAuth('mock-bearer-token', null, {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test',
      created_at: ''
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 'doc-1', filename: 'invoice.pdf' }]
    });
    global.fetch = mockFetch;

    const docs = await api.listDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-1');
    expect(mockFetch).toHaveBeenCalled();
    const calledHeaders = mockFetch.mock.calls[0][1].headers;
    expect(calledHeaders.get('Authorization')).toBe('Bearer mock-bearer-token');
  });

  it('parses paginated responses properly', async () => {
    const paginatedPayload = {
      items: [{ id: 'doc-10', filename: 'receipt.png' }],
      total: 100,
      page: 1,
      page_size: 20,
      total_pages: 5
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => paginatedPayload
    });

    const res = await api.listDocumentsPaginated(1, 20);
    expect(res.total).toBe(100);
    expect(res.total_pages).toBe(5);
    expect(res.items).toHaveLength(1);
  });
});
