'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentDetail, StructuredInvoiceData } from '@/lib/types';
import DocumentPreview from '@/components/viewer/DocumentPreview';
import ExtractedForm from '@/components/viewer/ExtractedForm';
import ValidationBadges from '@/components/viewer/ValidationBadges';
import SpreadsheetViewer from '@/components/viewer/SpreadsheetViewer';
import SpreadsheetAnalytics from '@/components/viewer/SpreadsheetAnalytics';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  FileCode, 
  Download, 
  FileSpreadsheet, 
  GitCompare,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2
} from 'lucide-react';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [spreadsheetViewTab, setSpreadsheetViewTab] = useState<'grid' | 'heuristics'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!doc) return;
    try {
      setIsDeleting(true);
      await api.deleteDocument(doc.id);
      window.location.href = '/';
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
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

  const isSpreadsheet = 
    doc.file_type === 'excel' || 
    doc.file_type === 'csv' || 
    doc.is_spreadsheet || 
    Boolean(doc.sheets && Object.keys(doc.sheets).length > 0);

  const totalSpreadsheetRows = doc.sheets 
    ? Object.values(doc.sheets).reduce((acc, sheetRows) => acc + (sheetRows?.length || 0), 0)
    : 0;

  const downloadUrl = `http://localhost:8000/api/v1/documents/${doc.id}/download`;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition shadow-2xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {isSpreadsheet ? (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                ) : (
                  <FileCode className="w-5 h-5 text-indigo-600" />
                )}
                <span>{doc.filename}</span>
              </h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                isSpreadsheet 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {doc.file_type}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {(doc.file_size_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
              <span>UUID: {doc.id}</span>
              <span>•</span>
              <span>Uploaded {new Date(doc.created_at).toLocaleString()}</span>
              {isSpreadsheet && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-slate-600">
                    {Object.keys(doc.sheets || {}).length} Sheets ({totalSpreadsheetRows.toLocaleString()} Records)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={downloadUrl}
            download={doc.filename}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download</span>
          </a>

          <Link
            href={`/verification?sourceDoc=${doc.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200/60 text-indigo-700 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Cross-Verify</span>
          </Link>

          <button
            onClick={() => setShowRawText(!showRawText)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>{showRawText ? 'Hide Text' : 'View Text'}</span>
          </button>

          <button
            onClick={fetchDoc}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-rose-200/80 text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl shadow-2xs transition"
            title="Permanently delete document"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Raw text drawer if toggled */}
      {showRawText && doc.raw_text && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono max-h-64 overflow-y-auto border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            <span>Raw Document Stream / Parser Output</span>
            <span>{doc.raw_text.length.toLocaleString()} characters</span>
          </div>
          <pre className="whitespace-pre-wrap">{doc.raw_text}</pre>
        </div>
      )}

      {/* Content Layout: Spreadsheet vs Invoice Document */}
      {isSpreadsheet ? (
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpreadsheetViewTab('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  spreadsheetViewTab === 'grid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Interactive Multi-Sheet Grid</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {Object.keys(doc.sheets || {}).length} Sheets
                </span>
              </button>

              <button
                onClick={() => setSpreadsheetViewTab('heuristics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  spreadsheetViewTab === 'heuristics'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ledger Analytics & Quality Audit</span>
                {doc.validation && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    doc.validation.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.validation.review_status}
                  </span>
                )}
              </button>
            </div>
          </div>

          {spreadsheetViewTab === 'grid' ? (
            /* Dedicated Spreadsheet Multi-Sheet View */
            <SpreadsheetViewer
              sheets={doc.sheets || {}}
              filename={doc.filename}
              documentId={doc.id}
            />
          ) : (
            /* Dedicated Ledger Analytics & Quality Audit View */
            <SpreadsheetAnalytics
              documentId={doc.id}
              filename={doc.filename}
              totalRecords={totalSpreadsheetRows}
              totalSheets={Object.keys(doc.sheets || {}).length}
              sheetSummaries={(doc.structured_data as any)?.sheet_summaries || []}
              primaryMetrics={(doc.structured_data as any)?.primary_metrics || {}}
            />
          )}
        </div>
      ) : (
        /* Classic Side-by-Side Invoice / PDF Layout */
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
      )}

      {/* Centered Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Document"
        message={`Are you sure you want to delete "${doc.filename}"?\n\nThis will permanently purge this document, all ledger records, extraction data, and associated cross-verification results from PostgreSQL.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setShowDeleteModal(false)}
      />
    </div>
  );
}
