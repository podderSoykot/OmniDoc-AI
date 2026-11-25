'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem } from '@/lib/types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileCheck2, 
  AlertTriangle, 
  Layers, 
  Building2, 
  PieChart, 
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listDocuments().then((data) => {
      setDocuments(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Aggregated calculations
  const totalVolume = documents.reduce((sum, d) => sum + (d.total || 0), 0);
  const passedDocs = documents.filter((d) => d.review_status === 'PASSED');
  const reviewNeeded = documents.filter((d) => d.review_status === 'NEEDS_MANUAL_REVIEW');
  const warningDocs = documents.filter((d) => d.review_status === 'WARNING');

  // Format Breakdown
  const pdfCount = documents.filter((d) => d.file_type === 'pdf').length;
  const excelCount = documents.filter((d) => ['excel', 'csv', 'xlsx', 'xls'].includes(d.file_type)).length;
  const imageCount = documents.filter((d) => ['png', 'jpg', 'jpeg', 'tiff', 'image'].includes(d.file_type)).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-7 pb-12">
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
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60 shadow-xs">
          Sub-Page • Executive Analytics
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Financial & Ingestion Analytics
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          High-level overview of portfolio capital volume, format distribution, automated validation metrics, and tenant audit compliance.
        </p>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gross Capital Audited</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Reconciled Across {documents.length} Docs
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Validation Pass Rate</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {documents.length > 0 ? ((passedDocs.length / documents.length) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-[11px] font-semibold text-indigo-600">
            {passedDocs.length} of {documents.length} Passed Audit
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Needs Manual Review</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{reviewNeeded.length}</p>
          <p className="text-[11px] font-semibold text-rose-600">
            Math / Format Inconsistencies
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Discrepancy Warnings</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{warningDocs.length}</p>
          <p className="text-[11px] font-semibold text-amber-600">
            Tolerance / Date Warnings
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion By Format */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Corpus Format Distribution</h3>
              <p className="text-xs text-slate-400">Multi-type pipeline routing analysis</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Digital & Multi-page PDF
                </span>
                <span className="text-slate-900 font-mono">{pdfCount} ({documents.length ? ((pdfCount / documents.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${documents.length ? (pdfCount / documents.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Multi-Sheet Excel & CSV Ledgers
                </span>
                <span className="text-slate-900 font-mono">{excelCount} ({documents.length ? ((excelCount / documents.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${documents.length ? (excelCount / documents.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Scanned OCR Receipts & Images
                </span>
                <span className="text-slate-900 font-mono">{imageCount} ({documents.length ? ((imageCount / documents.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${documents.length ? (imageCount / documents.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quality Audit Health */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Deterministic Audit Integrity</h3>
              <p className="text-xs text-slate-400">Subtotal + Tax = Total tolerance engine</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-950">Strict Pass (Green Status)</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Math balance and required business rules matched 100%.</p>
              </div>
              <span className="text-base font-black text-emerald-800 font-mono">{passedDocs.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-950">Action Required (Red Status)</p>
                <p className="text-[11px] text-rose-700 mt-0.5">Discrepancy detected; review queue intervention needed.</p>
              </div>
              <span className="text-base font-black text-rose-800 font-mono">{reviewNeeded.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-950">Tolerance Warning (Yellow Status)</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Minor rounding delta under ±$0.05 or missing date format.</p>
              </div>
              <span className="text-base font-black text-amber-800 font-mono">{warningDocs.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
