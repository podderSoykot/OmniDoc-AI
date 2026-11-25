'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem } from '@/lib/types';
import { 
  AlertOctagon, 
  ArrowLeft, 
  RefreshCw, 
  RotateCw, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Layers,
  UploadCloud
} from 'lucide-react';

export default function FailedRetriesPage() {
  const [failedDocs, setFailedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFailed = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments();
      const failed = data.filter((d) => d.status === 'failed');
      setFailedDocs(failed);
    } catch (e: any) {
      console.error(e);
      setNotification({
        type: 'error',
        message: e?.message || 'Failed to fetch document status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
  }, []);

  const handleRetry = async (docId: string, filename: string) => {
    try {
      setRetryingId(docId);
      await api.retryJob(docId);
      setNotification({
        type: 'success',
        message: `Successfully re-queued "${filename}" for OCR and processing.`
      });
      // Refresh list
      await fetchFailed();
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || `Failed to re-queue "${filename}".`
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    if (failedDocs.length === 0) return;
    try {
      setRetryingAll(true);
      for (const doc of failedDocs) {
        try {
          await api.retryJob(doc.id);
        } catch (err) {
          console.error(`Retry failed for ${doc.id}`, err);
        }
      }
      setNotification({
        type: 'success',
        message: `Initiated retry for ${failedDocs.length} failed jobs.`
      });
      await fetchFailed();
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e?.message || 'Failed to re-queue all jobs.'
      });
    } finally {
      setRetryingAll(false);
    }
  };

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
            href="/upload/queue"
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 px-3 py-1 rounded-full"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Processing Queue</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60 shadow-xs">
            Batch Ingestion • Error Recovery
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Failed & Retries Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Audit OCR extraction anomalies, corrupted binary streams, and API timeout failures. Re-dispatch workers with automated fallbacks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {failedDocs.length > 0 && (
            <button
              onClick={handleRetryAll}
              disabled={retryingAll || loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/25 transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
              <span>Retry All ({failedDocs.length})</span>
            </button>
          )}

          <button
            onClick={fetchFailed}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Failed Jobs</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600">{failedDocs.length}</p>
          <p className="text-[11px] font-semibold text-slate-500">Awaiting remediation or retry</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Retry Strategy</span>
            <RotateCw className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">Exponential</p>
          <p className="text-[11px] font-semibold text-indigo-600">Background Worker Auto-Backoff</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Action Plan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {failedDocs.length === 0 ? 'Healthy' : 'Action Required'}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600">
            {failedDocs.length === 0 ? 'All pipelines running smoothly' : 'Manual trigger available'}
          </p>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-black text-slate-900">Document Failure Registry</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {failedDocs.length} {failedDocs.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Checking document failure logs...</p>
          </div>
        ) : failedDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Zero Failed Ingestions</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All parsed documents have successfully passed OCR parsing, JSON extraction, and rule validation!
            </p>
            <div className="pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Batch</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {failedDocs.map((doc) => {
              const isRetrying = retryingId === doc.id || retryingAll;
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {doc.filename}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100 font-bold uppercase">
                          Failed
                        </span>
                      </div>

                      {/* Error Diagnostic */}
                      <div className="p-2 bg-rose-50/60 rounded-lg border border-rose-100 text-[11px] text-rose-800 font-mono">
                        <span className="font-bold text-rose-900">Diagnostic: </span>
                        {doc.error_message || 'Unspecified parsing error or OCR stream interrupted.'}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          ID: {doc.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleRetry(doc.id, doc.filename)}
                      disabled={isRetrying}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry Job'}</span>
                    </button>

                    <Link
                      href={`/documents/${doc.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
