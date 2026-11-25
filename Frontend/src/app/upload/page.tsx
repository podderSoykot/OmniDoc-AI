'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { JobStatus } from '@/lib/types';
import DropZone from '@/components/upload/DropZone';
import ProgressTracker from '@/components/upload/ProgressTracker';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    try {
      setIsUploading(true);
      const res = await api.uploadDocuments(files);

      // Initialize job states
      const initialJobs: JobStatus[] = res.jobs.map((j) => ({
        job_id: j.job_id,
        document_id: j.document_id,
        status: 'pending',
        progress_percentage: 10,
        current_step: `Queued: ${j.filename}`,
      }));
      setJobs(initialJobs);

      // Poll job status until complete
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400 font-medium">Batch OCR & AI Extraction Pipeline</span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upload Documents</h1>
        <p className="text-xs text-slate-500">
          Upload multi-page PDFs (up to 1,000 pages), invoices, receipts, scans, or Excel spreadsheets.
        </p>
      </div>

      <DropZone onFilesSelected={handleFilesSelected} isUploading={isUploading} />
      <ProgressTracker jobs={jobs} />
    </div>
  );
}
