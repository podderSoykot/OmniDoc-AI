import React from 'react';
import { ValidationReport } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ValidationBadgesProps {
  validation?: ValidationReport | null;
}

export default function ValidationBadges({ validation }: ValidationBadgesProps) {
  if (!validation) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          {validation.is_valid ? (
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          )}
          <span>Automated Validation Audit</span>
        </h3>

        <span
          className={`text-xs font-black tracking-wide px-3 py-1 rounded-full uppercase border ${
            validation.review_status === 'PASSED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : validation.review_status === 'WARNING'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          }`}
        >
          {validation.review_status}
        </span>
      </div>

      {validation.math_errors.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Mathematical Calculation Inconsistencies ({validation.math_errors.length})</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 font-medium">
            {validation.math_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.business_errors.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Business Rules & Mandatory Checks</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 font-medium">
            {validation.business_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Advisory Warnings ({validation.warnings.length})</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-amber-700 space-y-1 font-medium">
            {validation.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.math_errors.length === 0 && validation.business_errors.length === 0 && validation.warnings.length === 0 && (
        <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>All line items sum to subtotal, taxes balance, and business rules passed with zero errors.</span>
        </div>
      )}
    </div>
  );
}
