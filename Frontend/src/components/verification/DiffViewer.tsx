import React from 'react';
import { CrossVerifyResponse } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface DiffViewerProps {
  result: CrossVerifyResponse;
}

export default function DiffViewer({ result }: DiffViewerProps) {
  const isHighMatch = result.match_score >= 80;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Cross-Verification Outcome</span>
          <h3 className="text-lg font-black text-slate-900 mt-1">{result.summary}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated comparison across all fields and line item amounts</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
          <div className="text-right">
            <span className={`text-3xl font-black ${isHighMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
              {result.match_score}%
            </span>
            <p className="text-[10px] uppercase font-bold text-slate-400">Match Confidence</p>
          </div>
          <div className={`p-2.5 rounded-xl ${isHighMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3.5">
          Audited Discrepancies ({result.discrepancies.length})
        </h4>

        {result.discrepancies.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Complete agreement! Both documents correspond with zero discrepancy in totals, vendor names, or items.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {result.discrepancies.map((disc, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs transition-all ${
                  disc.severity === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : disc.severity === 'WARNING'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    {disc.severity === 'CRITICAL' && <XCircle className="w-4 h-4 text-rose-600" />}
                    {disc.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    Field: {disc.field}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-black bg-white shadow-2xs">
                    {disc.severity}
                  </span>
                </div>

                <p className="font-semibold text-slate-700">{disc.message}</p>

                <div className="mt-2.5 flex items-center gap-3 text-slate-700 bg-white/90 p-2.5 rounded-lg border border-slate-200/60 font-medium">
                  <div className="truncate flex-1">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">Source Document</span>
                    <span className="text-slate-800 font-bold">{String(disc.source_value)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="truncate flex-1">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">Target Document</span>
                    <span className="text-slate-800 font-bold">{String(disc.target_value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
