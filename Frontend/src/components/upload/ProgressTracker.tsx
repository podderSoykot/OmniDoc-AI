'use client';

import React from 'react';
import { JobStatus } from '@/lib/types';
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight, FileCheck, Layers, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProgressTrackerProps {
  jobs: JobStatus[];
}

export default function ProgressTracker({ jobs }: ProgressTrackerProps) {
  if (jobs.length === 0) return null;

  const allCompleted = jobs.every((j) => j.status === 'completed');
  const hasFailed = jobs.some((j) => j.status === 'failed');
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Active Pipeline Workers ({completedCount}/{jobs.length} Processed)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            PyMuPDF Multi-page Streaming • Tesseract OCR & Deskew • Strict Mathematical Validation
          </p>
        </div>

        {allCompleted && (
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Open Verified Corpus in Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Progress Cards */}
      <div className="space-y-3">
        {jobs.map((job) => {
          const isDone = job.status === 'completed';
          const isError = job.status === 'failed';
          const isProcessing = job.status === 'processing' || job.status === 'pending';

          return (
            <div 
              key={job.job_id} 
              className={`p-4 rounded-2xl border transition-all ${
                isDone 
                  ? 'bg-emerald-50/30 border-emerald-200/60' 
                  : isError 
                  ? 'bg-rose-50/40 border-rose-200/70' 
                  : 'bg-slate-50/70 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />}
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {isError && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span className="font-bold text-slate-800 truncate max-w-sm sm:max-w-md">
                    {job.current_step}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {job.status}
                  </span>
                  <span className={`font-black text-xs ${
                    isDone ? 'text-emerald-600' : isError ? 'text-rose-600' : 'text-indigo-600'
                  }`}>
                    {job.progress_percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isError
                      ? 'bg-rose-500'
                      : isDone
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                  }`}
                  style={{ width: `${job.progress_percentage}%` }}
                />
              </div>

              {job.error && (
                <div className="text-[11px] font-semibold text-rose-700 mt-2.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{job.error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
