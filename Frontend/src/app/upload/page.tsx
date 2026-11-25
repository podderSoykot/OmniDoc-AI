'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { JobStatus } from '@/lib/types';
import DropZone from '@/components/upload/DropZone';
import ProgressTracker from '@/components/upload/ProgressTracker';
import { 
  ArrowLeft, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  FileCheck2, 
  Layers, 
  FileSpreadsheet, 
  Clock 
} from 'lucide-react';

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
        current_step: `Queued for processing: ${j.filename}`,
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
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition group"
        >
          <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Return to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/upload/queue"
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 px-3 py-1 rounded-full"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Processing Queue</span>
          </Link>
          <Link
            href="/upload/failed"
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-100"
          >
            <span>Failed & Retries</span>
          </Link>
          <span className="hidden sm:inline-flex text-[11px] uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60 shadow-xs">
            Asynchronous Engine
          </span>
        </div>
      </div>

      {/* Hero Title & Subtext */}
      <div className="text-center space-y-2.5 max-w-2xl mx-auto">
        <div className="inline-flex p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 mb-1">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Batch Document Ingestion
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Upload up to 1,000 pages of multi-page PDFs, scanned receipts, camera photos, or Excel general ledgers for automated mathematical audit and AI extraction.
        </p>
      </div>

      {/* Architecture Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">PyMuPDF Streaming</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              Zero-OOM streaming processor handles 1,000+ page high-density business reports.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Computer Vision OCR</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              OpenCV deskewing and adaptive binarization with Tesseract neural OCR.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Deterministic Validation</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              Formula audits: Subtotal + Tax = Total with line item summation checks.
            </p>
          </div>
        </div>
      </div>

      {/* Drop Zone Component */}
      <DropZone onFilesSelected={handleFilesSelected} isUploading={isUploading} />

      {/* Async Progress Tracker */}
      <ProgressTracker jobs={jobs} />
    </div>
  );
}
