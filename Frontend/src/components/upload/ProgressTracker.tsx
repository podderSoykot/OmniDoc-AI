import React from 'react';
import { JobStatus } from '@/lib/types';
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProgressTrackerProps {
  jobs: JobStatus[];
}

export default function ProgressTracker({ jobs }: ProgressTrackerProps) {
  if (jobs.length === 0) return null;

  const allCompleted = jobs.every((j) => j.status === 'completed');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Active Pipeline Workers</h3>
          <p className="text-xs text-slate-400">PyMuPDF streaming • Tesseract OCR • Zero-Hallucination AI</p>
        </div>
        {allCompleted && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            <span>View in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="space-y-3.5">
        {jobs.map((job) => (
          <div key={job.job_id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-800 font-semibold flex items-center gap-2">
                {job.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {job.status === 'failed' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                {job.current_step}
              </span>
              <span className="text-indigo-600 font-black tracking-tight">{job.progress_percentage}%</span>
            </div>

            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  job.status === 'failed'
                    ? 'bg-rose-500'
                    : job.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                }`}
                style={{ width: `${job.progress_percentage}%` }}
              />
            </div>
            {job.error && (
              <p className="text-[11px] font-medium text-rose-600 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                {job.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
