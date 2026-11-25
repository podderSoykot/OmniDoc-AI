'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem } from '@/lib/types';
import StatCard from '@/components/dashboard/StatCard';
import DocumentTable from '@/components/dashboard/DocumentTable';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  Search, 
  RefreshCw, 
  X, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchDocs = async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listDocumentsPaginated(
        currentPage,
        currentPageSize,
        searchQuery,
        statusFilter,
        fileTypeFilter
      );
      setDocuments(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
      setPage(data.page);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchDocs(1, pageSize);
  }, [statusFilter, fileTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocs(1, pageSize);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setFileTypeFilter('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchDocs(newPage, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    fetchDocs(1, newPageSize);
  };

  const handleDeleteDocument = async (id: string, filename: string) => {
    await api.deleteDocument(id);
    setToastMessage(`Document "${filename}" permanently deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchDocs(page, pageSize);
  };

  const handleBulkDelete = async (ids: string[]) => {
    await api.bulkDeleteDocuments(ids);
    setToastMessage(`${ids.length} documents permanently deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchDocs(page, pageSize);
  };

  const totalDocs = totalItems;
  const passedDocs = documents.filter((d) => d.review_status === 'PASSED').length;
  const reviewNeeded = documents.filter((d) => d.review_status === 'NEEDS_MANUAL_REVIEW').length;
  const warningDocs = documents.filter((d) => d.review_status === 'WARNING').length;

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Document Intelligence Dashboard
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Live Realtime
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Automated multi-format financial parsing, zero-hallucination extraction & mathematical auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDocs(page, pageSize)}
            disabled={loading}
            aria-label="Refresh document list"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            <span>Upload Batch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards: 4-column responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={totalDocs}
          subtitle="Stored in PostgreSQL"
          icon={<FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />}
          color="from-indigo-500/10 to-violet-500/10 text-indigo-600"
        />
        <StatCard
          title="Audited & Passed"
          value={passedDocs}
          subtitle="Calculation match"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" aria-hidden="true" />}
          color="from-teal-500/10 to-emerald-500/10 text-teal-600"
          badge={totalDocs > 0 ? `${Math.round((passedDocs / totalDocs) * 100)}%` : undefined}
        />
        <StatCard
          title="Needs Review"
          value={reviewNeeded}
          subtitle="Math or missing flags"
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" aria-hidden="true" />}
          color="from-rose-500/10 to-red-500/10 text-rose-600"
        />
        <StatCard
          title="Advisory Warnings"
          value={warningDocs}
          subtitle="Minor date/vendor alerts"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />}
          color="from-amber-500/10 to-yellow-500/10 text-amber-600"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96" role="search">
          <label htmlFor="dashboard-search" className="sr-only">Search documents</label>
          <input
            id="dashboard-search"
            type="text"
            placeholder="Search invoice #, supplier name, or OCR content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => { setSearchQuery(''); fetchDocs(1, pageSize); }} 
              aria-label="Clear search query"
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Format filter */}
          <label htmlFor="format-filter" className="sr-only">Filter by file format</label>
          <select
            id="format-filter"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 text-slate-700 font-semibold focus:bg-white transition"
          >
            <option value="">All Formats</option>
            <option value="pdf">PDF Only</option>
            <option value="image">Scanned Images</option>
            <option value="excel">Excel & CSV</option>
          </select>

          {/* Validation Status filter */}
          <label htmlFor="status-filter" className="sr-only">Filter by validation status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 text-slate-700 font-semibold focus:bg-white transition"
          >
            <option value="">All Statuses</option>
            <option value="PASSED">Passed (Green)</option>
            <option value="NEEDS_MANUAL_REVIEW">Needs Review (Red)</option>
            <option value="WARNING">Warnings (Yellow)</option>
          </select>

          {(searchQuery || statusFilter || fileTypeFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div 
          role="alert"
          className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDocs(page, pageSize)}
            className="font-bold underline hover:no-underline text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 text-xs font-medium" role="status">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" aria-hidden="true" />
          <span>Loading document corpus...</span>
        </div>
      ) : (
        <DocumentTable 
          documents={documents} 
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onDelete={handleDeleteDocument} 
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
