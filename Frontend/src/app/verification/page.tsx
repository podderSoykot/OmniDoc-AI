'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem, CrossVerifyResponse } from '@/lib/types';
import DiffViewer from '@/components/verification/DiffViewer';
import { 
  ArrowLeft, 
  GitCompare, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  ArrowLeftRight, 
  Sparkles, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';

function VerificationContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sourceDocId, setSourceDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<CrossVerifyResponse | null>(null);

  // Fetch document list and handle query params
  useEffect(() => {
    api.listDocuments().then((docs) => {
      setDocuments(docs);

      const paramSource = searchParams.get('sourceDoc');
      const paramTarget = searchParams.get('targetDoc');

      if (paramSource && docs.some((d) => d.id === paramSource)) {
        setSourceDocId(paramSource);

        // Auto-select a smart candidate for target
        if (paramTarget && docs.some((d) => d.id === paramTarget)) {
          setTargetDocId(paramTarget);
        } else {
          const selectedDoc = docs.find((d) => d.id === paramSource);
          if (selectedDoc?.file_type === 'excel') {
            // Find an invoice PDF
            const candidate = docs.find((d) => d.file_type === 'pdf' && d.id !== paramSource);
            if (candidate) setTargetDocId(candidate.id);
          } else {
            // Find a PO or Excel file
            const candidate = docs.find((d) => d.id !== paramSource && (d.file_type === 'excel' || d.filename.includes('po')));
            if (candidate) setTargetDocId(candidate.id);
          }
        }
      }
    }).catch(console.error);
  }, [searchParams]);

  const handleSwap = () => {
    const temp = sourceDocId;
    setSourceDocId(targetDocId);
    setTargetDocId(temp);
    setResult(null);
  };

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

  // Preset quick tests
  const applyPreset = (srcName: string, tgtName: string) => {
    const s = documents.find((d) => d.filename.toLowerCase().includes(srcName.toLowerCase()));
    const t = documents.find((d) => d.filename.toLowerCase().includes(tgtName.toLowerCase()));
    if (s && t) {
      setSourceDocId(s.id);
      setTargetDocId(t.id);
      setResult(null);
    } else {
      alert(`Preset documents (${srcName} / ${tgtName}) not found in the current workspace.`);
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

      {/* Quick Match Presets */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Quick Benchmark Presets:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => applyPreset('valid_invoice', 'matching_po')}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
          >
            PDF ↔ PDF: Invoice vs PO (100% Match)
          </button>
          <button
            onClick={() => applyPreset('valid_invoice', 'corporate_general_ledger')}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition"
          >
            PDF ↔ Excel: Invoice vs General Ledger
          </button>
          <button
            onClick={() => applyPreset('math_mismatch', 'matching_po')}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
          >
            Discrepancy Test (Mismatch Audit)
          </button>
        </div>
      </div>

      {/* Selectors Card */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Source Doc */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              1. Source Document
            </label>
            <select
              value={sourceDocId}
              onChange={(e) => setSourceDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select source document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_type === 'excel' 
                    ? `[EXCEL] ${d.filename} — Multi-Sheet Ledger`
                    : `[PDF] ${d.filename} — $${d.total ? Number(d.total).toFixed(2) : '0.00'}`}
                </option>
              ))}
            </select>

            {sourceDoc && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{sourceDoc.supplier_name || sourceDoc.filename}</p>
                  <p className="text-[11px] text-slate-400">
                    {sourceDoc.file_type.toUpperCase()} • {sourceDoc.file_type === 'excel' ? 'Spreadsheet' : `${sourceDoc.page_count} pgs`}
                  </p>
                </div>
                <div className="text-right font-black text-slate-900">
                  {sourceDoc.file_type === 'excel' 
                    ? <span className="text-[11px] font-bold text-emerald-600">Multi-Sheet</span> 
                    : `$${sourceDoc.total ? Number(sourceDoc.total).toFixed(2) : '0.00'}`
                  }
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-4">
            <button
              onClick={handleSwap}
              type="button"
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-500 transition shadow-2xs"
              title="Swap Source and Target"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Target Doc */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
              2. Target Document
            </label>
            <select
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select target document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_type === 'excel' 
                    ? `[EXCEL] ${d.filename} — Multi-Sheet Ledger`
                    : `[PDF] ${d.filename} — $${d.total ? Number(d.total).toFixed(2) : '0.00'}`}
                </option>
              ))}
            </select>

            {targetDoc && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{targetDoc.supplier_name || targetDoc.filename}</p>
                  <p className="text-[11px] text-slate-400">
                    {targetDoc.file_type.toUpperCase()} • {targetDoc.file_type === 'excel' ? 'Spreadsheet' : `${targetDoc.page_count} pgs`}
                  </p>
                </div>
                <div className="text-right font-black text-slate-900">
                  {targetDoc.file_type === 'excel' 
                    ? <span className="text-[11px] font-bold text-emerald-600">Multi-Sheet</span> 
                    : `$${targetDoc.total ? Number(targetDoc.total).toFixed(2) : '0.00'}`
                  }
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

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="p-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading cross-verification suite...</p>
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
