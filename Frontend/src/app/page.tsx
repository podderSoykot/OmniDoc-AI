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
  DollarSign
} from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments(searchQuery, statusFilter, fileTypeFilter);
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter, fileTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setFileTypeFilter('');
  };

  const handleDeleteDocument = async (id: string, filename: string) => {
    await api.deleteDocument(id);
    setToastMessage(`Document "${filename}" permanently deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchDocs();
  };

  const totalDocs = documents.length;
  const passedDocs = documents.filter((d) => d.review_status === 'PASSED').length;
  const reviewNeeded = documents.filter((d) => d.review_status === 'NEEDS_MANUAL_REVIEW').length;
  const warningDocs = documents.filter((d) => d.review_status === 'WARNING').length;

  // Cumulative Grand Total across all extracted and ingested documents
  const cumulativeGrandTotal = documents.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  const valuedDocsCount = documents.filter((d) => (Number(d.total) || 0) > 0).length;

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
            onClick={fetchDocs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
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
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          color="from-indigo-500/10 to-violet-500/10 text-indigo-600"
        />
        <StatCard
          title="Audited & Passed"
          value={passedDocs}
          subtitle="100% calculation match"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
          color="from-teal-500/10 to-emerald-500/10 text-teal-600"
          badge={totalDocs > 0 ? `${Math.round((passedDocs / totalDocs) * 100)}%` : undefined}
        />
        <StatCard
          title="Needs Review"
          value={reviewNeeded}
          subtitle="Math or missing flags"
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          color="from-rose-500/10 to-red-500/10 text-rose-600"
        />
        <StatCard
          title="Advisory Warnings"
          value={warningDocs}
          subtitle="Minor date/vendor alerts"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          color="from-amber-500/10 to-yellow-500/10 text-amber-600"
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search invoice #, supplier name, or OCR content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Format filter */}
          <select
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
          <select
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
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 text-xs font-medium">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
          Loading document corpus...
        </div>
      ) : (
        <DocumentTable documents={documents} onDelete={handleDeleteDocument} />
      )}
    </div>
  );
}
