'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DocumentItem } from '@/lib/types';
import { 
  FileText, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sheet, 
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Edit3,
  Eye
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface DocumentTableProps {
  documents: DocumentItem[];
  onDelete?: (id: string, filename: string) => Promise<void>;
}

export default function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<{ id: string; filename: string } | null>(null);

  const requestDelete = (id: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setModalTarget({ id, filename });
  };

  const handleConfirmDelete = async () => {
    if (!modalTarget || !onDelete) return;
    try {
      setDeletingId(modalTarget.id);
      await onDelete(modalTarget.id, modalTarget.filename);
      setModalTarget(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PASSED
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            WARNING
          </span>
        );
      case 'NEEDS_MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            REVIEW NEEDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            {status || 'PENDING'}
          </span>
        );
    }
  };

  const getFormatIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100"><FileText className="w-4 h-4" /></div>;
      case 'excel':
      case 'csv':
        return <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"><Sheet className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100"><ImageIcon className="w-4 h-4" /></div>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-400">
            <tr>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Type & Volume</th>
              <th className="px-6 py-4">Supplier / Context</th>
              <th className="px-6 py-4">Grand Total</th>
              <th className="px-6 py-4">Validation State</th>
              <th className="px-6 py-4">Ingested At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No documents in current view</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload invoices, scans, or spreadsheets to begin automated processing.
                    </p>
                    <Link
                      href="/upload"
                      className="mt-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
                    >
                      Upload First Batch
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFormatIcon(doc.file_type)}
                      <div>
                        <Link 
                          href={`/documents/${doc.id}`}
                          className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-xs block" 
                          title={doc.filename}
                        >
                          {doc.filename}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          {(doc.file_size_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-slate-700 uppercase">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                      {doc.file_type}
                    </span>
                    <span className="ml-1.5 text-slate-400 text-[11px] font-medium lowercase">
                      ({doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'})
                    </span>
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-800">
                    {doc.supplier_name ? (
                      <span className="truncate max-w-[170px] block" title={doc.supplier_name}>
                        {doc.supplier_name}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">Not extracted</span>
                    )}
                  </td>

                  <td className="px-6 py-4 font-black text-slate-900 text-sm">
                    {doc.total !== null && doc.total !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">
                          ${Number(doc.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {doc.file_type === 'excel' && (
                          <span className="text-[9px] font-bold uppercase tracking-tight text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                            Ledger
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal italic">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {getBadge(doc.review_status)}
                  </td>

                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {formatDate(doc.created_at)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* View / Inspect Document Icon */}
                      <Link
                        href={`/documents/${doc.id}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                        title="View & Inspect Document"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Edit Fields Icon */}
                      <Link
                        href={`/documents/${doc.id}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition border border-transparent hover:border-amber-100"
                        title="Edit Extracted Fields & Line Items"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      {/* Delete Document Icon */}
                      {onDelete && (
                        <button
                          onClick={(e) => requestDelete(doc.id, doc.filename, e)}
                          disabled={deletingId === doc.id}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 disabled:opacity-40"
                          title="Delete Document"
                        >
                          {deletingId === doc.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(modalTarget)}
        title="Delete Document"
        message={`Are you sure you want to delete "${modalTarget?.filename}"?\n\nThis will permanently remove the file, associated ledger records, extractions, and verification results from PostgreSQL.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={Boolean(deletingId)}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deletingId && setModalTarget(null)}
      />
    </div>
  );
}
