import React from 'react';
import { CrossVerifyResponse } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface DiffViewerProps {
  result: CrossVerifyResponse;
}

export default function DiffViewer({ result }: DiffViewerProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs uppercase font-bold text-slate-500">Cross-Verification Result</span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">{result.summary}</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-indigo-600">{result.match_score}%</span>
          <p className="text-[10px] uppercase font-bold text-slate-400">Match Confidence</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Detected Discrepancies ({result.discrepancies.length})
        </h4>

        {result.discrepancies.length === 0 ? (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Perfect match! All compared data points, totals, and line items align completely.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {result.discrepancies.map((disc, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border text-xs ${
                  disc.severity === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : disc.severity === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5 uppercase">
                    {disc.severity === 'CRITICAL' && <XCircle className="w-4 h-4 text-rose-600" />}
                    {disc.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    Field: {disc.field}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-white/70">
                    {disc.severity}
                  </span>
                </div>
                <p className="font-medium text-slate-700">{disc.message}</p>
                <div className="mt-2 flex items-center gap-3 text-slate-600 bg-white/80 p-2 rounded">
                  <div>
                    <span className="font-semibold text-slate-400">Source:</span> {String(disc.source_value)}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="font-semibold text-slate-400">Target:</span> {String(disc.target_value)}
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
