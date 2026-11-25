'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
  ArrowLeftRight, 
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

function VerificationContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sourceDocId, setSourceDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<CrossVerifyResponse | null>(null);

  useEffect(() => {
    api.listDocuments().then((docs) => {
      setDocuments(docs);
      const paramSource = searchParams.get('sourceDoc');
      const paramTarget = searchParams.get('targetDoc');

      if (paramSource && docs.some((d) => d.id === paramSource)) {
        setSourceDocId(paramSource);
        if (paramTarget && docs.some((d) => d.id === paramTarget)) {
          setTargetDocId(paramTarget);
        } else {
          const selectedDoc = docs.find((d) => d.id === paramSource);
          if (selectedDoc?.file_type === 'excel') {
            const candidate = docs.find((d) => d.file_type === 'pdf' && d.id !== paramSource);
            if (candidate) setTargetDocId(candidate.id);
          } else {
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

  const applyPreset = (srcKeyword: string, tgtKeyword: string) => {
    const s = documents.find((d) => d.filename.toLowerCase().includes(srcKeyword.toLowerCase()));
    const t = documents.find((d) => d.filename.toLowerCase().includes(tgtKeyword.toLowerCase()));
    if (s && t) {
      setSourceDocId(s.id);
      setTargetDocId(t.id);
      setResult(null);
    } else {
      alert(`Preset documents matching '${srcKeyword}' / '${tgtKeyword}' not found in current files.`);
    }
  };

  const sourceDoc = documents.find((d) => d.id === sourceDocId);
  const targetDoc = documents.find((d) => d.id === targetDocId);

  const isExcelMode = sourceDoc?.file_type === 'excel' || targetDoc?.file_type === 'excel';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full">
            Pairwise Reconciliation Engine
          </span>
        </div>
      </div>

      {/* Hero Title & Benchmark Quick-Select */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cross-Document Verification
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select any two documents to cross-audit line items, vendors, tax calculations, or general ledger records.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('valid_invoice', 'matching_po')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition border border-transparent hover:border-indigo-100"
            >
              PDF ↔ PDF (PO vs Inv)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('valid_invoice', 'corporate_general_ledger')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition border border-transparent hover:border-emerald-100"
            >
              PDF ↔ Excel (Ledger)
            </button>
          </div>
        </div>

        {/* Verification Methodology Banner */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isExcelMode ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {isExcelMode ? <FileSpreadsheet className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {isExcelMode ? 'Mode: Multi-Sheet Spreadsheet Reconciliation' : 'Mode: 3-Way Match (Invoice vs Purchase Order)'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isExcelMode 
                  ? 'Searching worksheet entries for identifier matching, line value validation, and vendor party parity.'
                  : 'Comparing totals, subtotal, tax amount, vendor entity, and item counts directly.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tolerance: ±$0.05
            </span>
            <span className="flex items-center gap-1 text-indigo-600">
              <ShieldCheck className="w-3.5 h-3.5" /> Similarity: ≥70%
            </span>
          </div>
        </div>

        {/* Document Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Document A (Source) */}
          <div className="md:col-span-5 bg-slate-50/60 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Source Document
              </span>
              {sourceDoc && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  sourceDoc.file_type === 'excel' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {sourceDoc.file_type}
                </span>
              )}
            </div>

            <select
              value={sourceDocId}
              onChange={(e) => setSourceDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select source document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>

            {sourceDoc && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 truncate max-w-[200px]">
                    {sourceDoc.supplier_name || sourceDoc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {sourceDoc.file_type === 'excel' ? 'Spreadsheet Ledger' : `${sourceDoc.page_count} Pages`}
                  </p>
                </div>
                <div className="font-black text-slate-900">
                  {sourceDoc.file_type === 'excel' ? 'Ledger Rows' : `$${Number(sourceDoc.total || 0).toFixed(2)}`}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 shadow-sm transition active:scale-95"
              title="Swap documents"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Document B (Target) */}
          <div className="md:col-span-5 bg-slate-50/60 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Target Document
              </span>
              {targetDoc && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  targetDoc.file_type === 'excel' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {targetDoc.file_type}
                </span>
              )}
            </div>

            <select
              value={targetDocId}
              onChange={(e) => setTargetDocId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select target document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.file_type.toUpperCase()})
                </option>
              ))}
            </select>

            {targetDoc && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 truncate max-w-[200px]">
                    {targetDoc.supplier_name || targetDoc.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {targetDoc.file_type === 'excel' ? 'Spreadsheet Ledger' : `${targetDoc.page_count} Pages`}
                  </p>
                </div>
                <div className="font-black text-slate-900">
                  {targetDoc.file_type === 'excel' ? 'Ledger Rows' : `$${Number(targetDoc.total || 0).toFixed(2)}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRunVerification}
          disabled={verifying || !sourceDocId || !targetDocId}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
        >
          {verifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Line Items & Reconciling Values...</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Run Automated Cross-Verification</span>
            </>
          )}
        </button>
      </div>

      {/* Discrepancies and Diff Outcome */}
      {result && <DiffViewer result={result} />}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-sm font-bold text-slate-700">Loading cross-verification suite...</p>
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
