'use client';

import React from 'react';
import { ValidationReport } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, Activity, Flame } from 'lucide-react';

interface ValidationBadgesProps {
  validation?: ValidationReport | null;
}

export default function ValidationBadges({ validation }: ValidationBadgesProps) {
  if (!validation) return null;

  // Calculate Fraud & Integrity Risk Score (0 = Pristine, 100 = High Risk)
  const mathErrorWeight = validation.math_errors.length * 35;
  const bizErrorWeight = validation.business_errors.length * 40;
  const warningWeight = validation.warnings.length * 15;
  const rawRiskScore = Math.min(mathErrorWeight + bizErrorWeight + warningWeight, 100);

  const getRiskTier = () => {
    if (rawRiskScore === 0) return { label: 'LOW RISK', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' };
    if (rawRiskScore <= 45) return { label: 'MODERATE RISK', color: 'text-amber-700 bg-amber-50 border-amber-200', bar: 'bg-amber-500' };
    return { label: 'HIGH ANOMALY RISK', color: 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse', bar: 'bg-rose-500' };
  };

  const riskTier = getRiskTier();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Top Header */}
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
          <span>Automated Validation & Fraud Audit</span>
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

      {/* AI Risk & Anomaly Score Meter */}
      <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Document Integrity & Anomaly Meter</span>
          </div>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${riskTier.color}`}>
            {riskTier.label} ({rawRiskScore}/100)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${riskTier.bar}`}
            style={{ width: `${Math.max(rawRiskScore, 4)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500">
          {rawRiskScore === 0
            ? '100% calculation parity with zero anomaly flags detected.'
            : 'Unmatched calculations, duplicate keys, or missing required ledger fields detected.'}
        </p>
      </div>

      {/* Math Inconsistencies */}
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

      {/* Business & Mandatory Errors */}
      {validation.business_errors.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Business Rules & Duplicate Flags</span>
          </h4>
          <ul className="list-disc list-inside text-xs text-rose-700 space-y-1 font-medium">
            {validation.business_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Advisory Warnings */}
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

      {/* Passed State */}
      {validation.math_errors.length === 0 && validation.business_errors.length === 0 && validation.warnings.length === 0 && (
        <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Zero-Anomaly Verified</p>
            <p className="text-emerald-700 text-[11px] font-normal">
              Subtotal + Tax matches Grand Total perfectly within tolerance. All line items validated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
