import React from 'react';
import { ValidationReport } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

interface ValidationBadgesProps {
  validation?: ValidationReport | null;
}

export default function ValidationBadges({ validation }: ValidationBadgesProps) {
  if (!validation) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          Automated Validation Audit
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            validation.review_status === 'PASSED'
              ? 'bg-emerald-100 text-emerald-800'
              : validation.review_status === 'WARNING'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {validation.review_status}
        </span>
      </div>

      {validation.math_errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1 mb-1">
            <XCircle className="w-3.5 h-3.5" /> Mathematical Discrepancies
          </h4>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
            {validation.math_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.business_errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1 mb-1">
            <XCircle className="w-3.5 h-3.5" /> Business Rule Violations
          </h4>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
            {validation.business_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Warnings & Review Alerts
          </h4>
          <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
            {validation.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.math_errors.length === 0 && validation.business_errors.length === 0 && validation.warnings.length === 0 && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All financial calculations, line items, and business rules passed with zero errors.
        </div>
      )}
    </div>
  );
}
