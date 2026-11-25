'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { JobStatus } from '@/lib/types';
import DropZone from '@/components/upload/DropZone';
import ProgressTracker from '@/components/upload/ProgressTracker';
import { ArrowLeft, Cpu, ShieldCheck, Zap } from 'lucide-react';

export default function UploadPage() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    try {
      setIsUploading(true);
      const res = await api.uploadDocuments(files);

      const initialJobs: JobStatus[] = res.jobs.map((j) => ({
        job_id: j.job_id,
        document_id: j.document_id,
        status: 'pending',
        progress_percentage: 10,
        current_step: `Queued: ${j.filename}`,
      }));
      setJobs(initialJobs);

      pollJobs(res.jobs.map((j) => j.job_id));
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
      setIsUploading(false);
    }
  };

  const pollJobs = (jobIds: string[]) => {
    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(jobIds.map((id) => api.getJobStatus(id)));
        setJobs(updated);

        const allDone = updated.every((j) => j.status === 'completed' || j.status === 'failed');
        if (allDone) {
          clearInterval(interval);
          setIsUploading(false);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-7">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          Async Batch Pipeline
        </span>
      </div>

      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Batch Document Ingestion
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Upload multi-page PDFs (up to 1,000 pages), invoices, receipts, scans, or Excel files for automated AI extraction.
        </p>
      </div>

      {/* Feature cards banner */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-[11px] font-bold text-slate-800">PyMuPDF Streaming</p>
          <p className="text-[10px] text-slate-400">1000+ pgs without OOM</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <Cpu className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
          <p className="text-[11px] font-bold text-slate-800">Tesseract & OpenCV</p>
          <p className="text-[10px] text-slate-400">Deskew & denoise</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-[11px] font-bold text-slate-800">Zero Hallucination</p>
          <p className="text-[10px] text-slate-400">Strict Pydantic schema</p>
        </div>
      </div>

      <DropZone onFilesSelected={handleFilesSelected} isUploading={isUploading} />
      <ProgressTracker jobs={jobs} />
    </div>
  );
}
