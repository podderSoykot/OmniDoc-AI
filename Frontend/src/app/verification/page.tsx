'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem, CrossVerifyResponse } from '@/lib/types';
import DiffViewer from '@/components/verification/DiffViewer';
import { ArrowLeft, GitCompare, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export default function VerificationPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sourceDocId, setSourceDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<CrossVerifyResponse | null>(null);

  useEffect(() => {
    api.listDocuments().then(setDocuments).catch(console.error);
  }, []);

  const handleRunVerification = async () => {
    if (!sourceDocId || !targetDocId) {
      alert('Please select both a Source Document and a Target Document.');
      return;
    }
    if (sourceDocId === targetDocId) {
      alert('Please select two distinct documents to cross-verify.');
      return;
    }

    try {
      setVerifying(true);
      const res = await api.crossVerify(sourceDocId, targetDocId);
      setResult(res);
    } catch (e: any) {
      alert(`Cross-verification failed: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const sourceDoc = documents.find((d) => d.id === sourceDocId);
  const targetDoc = documents.find((d) => d.id === targetDocId);

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          Reconciliation Engine
        </span>
      </div>

      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cross-Document Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Perform automated pairwise reconciliation: <strong>PDF vs PDF</strong> (PO vs Invoice) or <strong>PDF vs Excel</strong> (Invoice vs General Ledger).
        </p>
      </div>

      {/* Selectors Card */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Doc */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              1. Source Document (Invoice PDF / Receipt)
            </label>
            <select
              value={sourceDocId}
              onChange={(e) => setSourceDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select source document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.file_type.toUpperCase()}) — ${d.total ?? 0}
                </option>
              ))}
            </select>

            {sourceDoc && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{sourceDoc.supplier_name || 'Vendor N/A'}</p>
                  <p className="text-[11px] text-slate-400">{sourceDoc.file_type.toUpperCase()} • {sourceDoc.page_count} pgs</p>
                </div>
                <div className="text-right font-black text-slate-900">
                  ${sourceDoc.total ? Number(sourceDoc.total).toFixed(2) : '0.00'}
                </div>
              </div>
            )}
          </div>

          {/* Target Doc */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              2. Target Document (Comparison PO or Excel Ledger)
            </label>
            <select
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select target document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.file_type.toUpperCase()}) — ${d.total ?? 0}
                </option>
              ))}
            </select>

            {targetDoc && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{targetDoc.supplier_name || 'Vendor N/A'}</p>
                  <p className="text-[11px] text-slate-400">{targetDoc.file_type.toUpperCase()} • {targetDoc.page_count} pgs</p>
                </div>
                <div className="text-right font-black text-slate-900">
                  ${targetDoc.total ? Number(targetDoc.total).toFixed(2) : '0.00'}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={verifying || !sourceDocId || !targetDocId}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
        >
          {verifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Line Items & Reconciling Values...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Execute Automated Cross-Verification</span>
            </>
          )}
        </button>
      </div>

      {result && <DiffViewer result={result} />}
    </div>
  );
}
