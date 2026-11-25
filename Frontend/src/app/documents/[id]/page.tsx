'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentDetail, StructuredInvoiceData } from '@/lib/types';
import DocumentPreview from '@/components/viewer/DocumentPreview';
import ExtractedForm from '@/components/viewer/ExtractedForm';
import ValidationBadges from '@/components/viewer/ValidationBadges';
import { ArrowLeft, RefreshCw, CheckCircle2, Clock, FileCode } from 'lucide-react';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const data = await api.getDocument(id);
      setDoc(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDoc();
  }, [id]);

  const handleSave = async (updatedData: StructuredInvoiceData) => {
    try {
      setSaving(true);
      await api.saveCorrection(id, updatedData);
      setToastMessage('Modifications saved to PostgreSQL & re-validated successfully!');
      setTimeout(() => setToastMessage(null), 4000);
      fetchDoc();
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading document inspection records...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving extraction state from PostgreSQL</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-rose-600">Document record not found.</p>
        <Link href="/" className="mt-3 inline-block text-xs font-semibold text-indigo-600 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{doc.filename}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {doc.file_type}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Document UUID: {doc.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>{showRawText ? 'Hide OCR Text' : 'View OCR Text'}</span>
          </button>

          <button
            onClick={fetchDoc}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Raw text drawer if toggled */}
      {showRawText && doc.raw_text && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            <span>Raw OCR / Extracted Document Stream</span>
            <span>{doc.raw_text.length} chars</span>
          </div>
          <pre className="whitespace-pre-wrap">{doc.raw_text}</pre>
        </div>
      )}

      {/* Main split-screen grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Previewer */}
        <div className="lg:col-span-6">
          <DocumentPreview documentId={doc.id} fileType={doc.file_type} filename={doc.filename} />
        </div>

        {/* Right Side: Validation & Form */}
        <div className="lg:col-span-6 space-y-6">
          <ValidationBadges validation={doc.validation} />
          {doc.structured_data && (
            <ExtractedForm
              data={doc.structured_data}
              confidences={doc.confidence_scores}
              onSave={handleSave}
              isSaving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
