'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem, CrossVerifyResponse } from '@/lib/types';
import DiffViewer from '@/components/verification/DiffViewer';
import { ArrowLeft, GitCompare, Play } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400 font-medium">Cross-Verification Engine</span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cross-Document Verification</h1>
        <p className="text-xs text-slate-500">
          Compare PDF vs PDF (e.g. Purchase Order vs Invoice) or PDF vs Excel (e.g. Invoice vs General Ledger/Bank Statement).
        </p>
      </div>

      {/* Selectors */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
            1. Source Document (Invoice PDF / Receipt)
          </label>
          <select
            value={sourceDocId}
            onChange={(e) => setSourceDocId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white"
          >
            <option value="">Select Source Document...</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.file_type.toUpperCase()}) — {d.supplier_name || 'N/A'} (${d.total ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
            2. Target Document (Comparison PDF or Excel/CSV)
          </label>
          <select
            value={targetDocId}
            onChange={(e) => setTargetDocId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white"
          >
            <option value="">Select Target Document...</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.file_type.toUpperCase()}) — {d.supplier_name || 'N/A'} (${d.total ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            onClick={handleRunVerification}
            disabled={verifying}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-sm shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <GitCompare className="w-4 h-4" />
            {verifying ? 'Running Cross-Verification Analysis...' : 'Run Automated Cross-Verification'}
          </button>
        </div>
      </div>

      {result && <DiffViewer result={result} />}
    </div>
  );
}
