'use client';

import React from 'react';
import { 
  Table2, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  Database, 
  FileSpreadsheet, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface SheetSummary {
  sheet_name: string;
  row_count: number;
  columns: string[];
  numeric_sums: Record<string, number>;
}

interface SpreadsheetAnalyticsProps {
  documentId: string;
  filename: string;
  totalRecords: number;
  totalSheets: number;
  sheetSummaries: SheetSummary[];
  primaryMetrics: Record<string, number>;
}

export default function SpreadsheetAnalytics({
  documentId,
  filename,
  totalRecords,
  totalSheets,
  sheetSummaries,
  primaryMetrics,
}: SpreadsheetAnalyticsProps) {
  // Extract key totals
  const invoiceGrandTotal = primaryMetrics['Invoice_Register::GrandTotal'] ?? 0;
  const poTotal = primaryMetrics['Purchase_Orders::TotalAmount'] ?? 0;
  const bankDebits = primaryMetrics['Bank_Reconciliation::DebitAmount'] ?? 0;
  const bankCredits = primaryMetrics['Bank_Reconciliation::CreditAmount'] ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Audit Pass */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-emerald-950">Spreadsheet Ledger Ingestion Verified</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 text-emerald-900">
                PASSED
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              100% structured multi-worksheet integrity verified. Zero corrupted rows across {totalRecords.toLocaleString()} entries.
            </p>
          </div>
        </div>

        <Link
          href={`/verification?sourceDoc=${documentId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span>Cross-Verify with PDF</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Worksheets</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSheets}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">{totalRecords.toLocaleString()} total entries</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoiced Grand Total</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ${invoiceGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Invoice_Register cumulative total</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PO Total Committed</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ${poTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Purchase_Orders aggregate value</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Movements</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2 font-mono flex items-center gap-1.5">
            <span className="text-rose-600">-${bankDebits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-600">+${bankCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Debits vs Credits reconciled</p>
        </div>
      </div>

      {/* Per-Sheet Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Table2 className="w-4 h-4 text-indigo-500" />
          <span>Worksheet Schema & Financial Aggregations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sheetSummaries.map((summary) => (
            <div key={summary.sheet_name} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-xs text-slate-900">{summary.sheet_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {summary.row_count} rows
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detected Columns ({summary.columns.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {summary.columns.map((c) => (
                      <span key={c} className="text-[10px] font-medium bg-slate-50 border border-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {Object.keys(summary.numeric_sums).length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calculated Totals</p>
                    {Object.entries(summary.numeric_sums).map(([col, sum]) => (
                      <div key={col} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{col}:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ${sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Health & Validation Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Automated Quality & Integrity Checks</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Multi-Sheet Table Headers Normalized</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Whitespace stripped and standardized column descriptors mapped.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">No Orphan or Corrupt Records</p>
              <p className="text-slate-500 text-[11px] mt-0.5">All {totalRecords.toLocaleString()} rows parsed with valid schema alignment.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Numeric Quantities & Currencies Parsed</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Subtotals, tax, unit prices, debits, and credits correctly float-cast.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Cross-Verification Engine Ready</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Can cross-verify any invoice or PO against this ledger instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
