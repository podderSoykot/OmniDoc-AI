'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthStorage } from '@/lib/auth';
import { SignedUrlInfo } from '@/lib/types';

interface DocumentPreviewProps {
  documentId: string;
  fileType: string;
  filename: string;
}

export default function DocumentPreview({ documentId, fileType, filename }: DocumentPreviewProps) {
  const [signedUrls, setSignedUrls] = useState<SignedUrlInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const token = AuthStorage.getToken();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getSignedUrl(documentId)
      .then((data) => {
        if (isMounted) {
          setSignedUrls(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Fallback to direct token url:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const previewUrl = signedUrls?.preview_url 
    ? `${backendBase}${signedUrls.preview_url}`
    : `${backendBase}/api/v1/documents/${documentId}/preview?token=${token || ''}`;

  const downloadUrl = signedUrls?.download_url 
    ? `${backendBase}${signedUrls.download_url}`
    : `${backendBase}/api/v1/documents/${documentId}/download?token=${token || ''}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 h-[780px] flex flex-col shadow-sm" role="region" aria-label={`Preview of ${filename}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            {fileType === 'image' ? <ImageIcon className="w-4 h-4" aria-hidden="true" /> : <FileText className="w-4 h-4" aria-hidden="true" />}
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 truncate max-w-xs" title={filename}>
              {filename}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Authorized Source Preview</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
            title="Open in new tab"
            aria-label="Open preview in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={downloadUrl}
            download={filename}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
            title="Download file"
            aria-label="Download original file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 bg-slate-100/70 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/50">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" aria-hidden="true" />
            <span>Generating secure authorized preview...</span>
          </div>
        ) : fileType === 'pdf' ? (
          <iframe
            src={`${previewUrl}#toolbar=0`}
            className="w-full h-full border-0 rounded-xl"
            title={`PDF Preview of ${filename}`}
          />
        ) : fileType === 'image' ? (
          <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
            <img
              src={previewUrl}
              alt={filename}
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 inline-block mb-3 shadow-xs">
              <FileText className="w-8 h-8 text-indigo-500" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-slate-800">Tabular Data Document</p>
            <p className="text-xs text-slate-400 mt-1">
              Spreadsheets are structured directly into field records on the right panel.
            </p>
            <a
              href={downloadUrl}
              download={filename}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download Spreadsheet
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
