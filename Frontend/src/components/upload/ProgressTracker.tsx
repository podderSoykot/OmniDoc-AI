import React from 'react';
import { JobStatus } from '@/lib/types';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ProgressTrackerProps {
  jobs: JobStatus[];
}

export default function ProgressTracker({ jobs }: ProgressTrackerProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-800 mb-3">Live Batch Processing Queue</h3>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.job_id} className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-700 flex items-center gap-1.5">
                {job.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {job.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                {job.current_step}
              </span>
              <span className="text-slate-500 font-semibold">{job.progress_percentage}%</span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  job.status === 'failed' ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${job.progress_percentage}%` }}
              />
            </div>
            {job.error && (
              <p className="text-xs text-rose-600 mt-1.5">{job.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
