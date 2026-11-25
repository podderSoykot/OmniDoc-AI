'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { JobStatus, DocumentItem } from '@/lib/types';
import { 
  Cpu, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Sparkles,
  ArrowRight,
  UploadCloud
} from 'lucide-react';

export default function ProcessingQueuePage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingDocs = documents.filter((d) => d.status === 'pending' || d.status === 'processing');
  const completedDocs = documents.filter((d) => d.status === 'completed');
  const failedDocs = documents.filter((d) => d.status === 'failed');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-7 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition group"
        >
          <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Back to Upload Dropzone</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/upload/failed"
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-100"
          >
            <span>Failed & Retries</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60 shadow-xs">
            Batch Ingestion • Live Worker Queue
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Active Processing Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Live telemetry of asynchronous worker threads executing PyMuPDF multi-page streaming, OpenCV deskewing, and Tesseract neural OCR.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* KPI Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Workers</span>
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingDocs.length}</p>
          <p className="text-[11px] font-semibold text-indigo-600">Currently in OCR / Parsing pipeline</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Completed Ingestions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{completedDocs.length}</p>
          <p className="text-[11px] font-semibold text-emerald-600">Extracted and structured in PostgreSQL</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Failed Jobs</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{failedDocs.length}</p>
          <p className="text-[11px] font-semibold text-rose-600">
            {failedDocs.length > 0 ? (
              <Link href="/upload/failed" className="underline hover:text-rose-700">View & retry failed jobs</Link>
            ) : 'Zero job failures detected'}
          </p>
        </div>
      </div>

      {/* Active Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Queue Execution History</h3>
            <p className="text-xs text-slate-400">Recent document ingestion jobs</p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Enqueue More Documents</span>
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-medium">
            No active jobs in the queue. Upload documents from the dropzone.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.slice(0, 15).map((doc) => {
              const isProcessing = doc.status === 'processing' || doc.status === 'pending';
              const isCompleted = doc.status === 'completed';
              const isFailed = doc.status === 'failed';

              return (
                <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
                      {isProcessing && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isFailed && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate max-w-sm sm:max-w-md">{doc.filename}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UUID: {doc.id} • {doc.file_type.toUpperCase()} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : isFailed ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {doc.status}
                    </span>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Inspect Document"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
