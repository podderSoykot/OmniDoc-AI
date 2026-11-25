'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem } from '@/lib/types';
import DocumentTable from '@/components/dashboard/DocumentTable';
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  Filter, 
  RefreshCw, 
  ShieldAlert, 
  Search,
  Sparkles
} from 'lucide-react';

export default function ReviewQueuePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      // Fetch only documents requiring manual review
      const data = await api.listDocuments('', 'NEEDS_MANUAL_REVIEW');
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDeleteDocument = async (id: string, filename: string) => {
    await api.deleteDocument(id);
    setToastMessage(`Document "${filename}" permanently removed from review queue.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchQueue();
  };

  const handleBulkDelete = async (ids: string[]) => {
    await api.bulkDeleteDocuments(ids);
    setToastMessage(`${ids.length} documents permanently deleted.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchQueue();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-7 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition group"
        >
          <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Back to All Documents</span>
        </Link>
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60 shadow-xs">
          Sub-Page • Exception Handling
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Action Required: Review Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Invoices and reports flagged by our deterministic math engine with calculation mismatches, negative numbers, or missing mandatory fields.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Info Warning Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Human-in-the-Loop Protocol:</span> Click on any flagged invoice below to inspect the extracted bounding boxes, view the side-by-side original file, and perform real-time manual corrections with audit trail persistence.
        </div>
      </div>

      {/* Document Table (Pre-filtered for review) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 text-xs font-medium">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
          Loading review queue corpus...
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          onDelete={handleDeleteDocument}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
