'use client';

import React, { useState, useMemo } from 'react';
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
  Eye,
  Download,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface DocumentTableProps {
  documents: DocumentItem[];
  onDelete?: (id: string, filename: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
}

export default function DocumentTable({ documents, onDelete, onBulkDelete }: DocumentTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<{ id: string; filename: string } | null>(null);
  const [isBulkDeleteModal, setIsBulkDeleteModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'BDT' | 'GBP'>('USD');

  const currencyRates = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    BDT: { symbol: '৳', rate: 121.5 },
  };

  const filteredDocs = useMemo(() => {
    if (statusFilter === 'ALL') return documents;
    return documents.filter((d) => (d.review_status || 'PENDING') === statusFilter);
  }, [documents, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const requestDelete = (id: string, filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setModalTarget({ id, filename });
  };

  const handleConfirmDelete = async () => {
    if (isBulkDeleteModal && onBulkDelete) {
      try {
        setDeletingId('bulk');
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        setIsBulkDeleteModal(false);
      } catch (err: any) {
        alert(`Bulk delete failed: ${err.message}`);
      } finally {
        setDeletingId(null);
      }
      return;
    }

    if (!modalTarget || !onDelete) return;
    try {
      setDeletingId(modalTarget.id);
      await onDelete(modalTarget.id, modalTarget.filename);
      setSelectedIds((prev) => prev.filter((i) => i !== modalTarget.id));
      setModalTarget(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Filename', 'Type', 'Supplier', 'Grand Total (USD)', 'Status', 'Created At'];
    const rows = filteredDocs.map((d) => [
      d.id,
      `"${d.filename.replace(/"/g, '""')}"`,
      d.file_type,
      `"${(d.supplier_name || '').replace(/"/g, '""')}"`,
      d.total !== null && d.total !== undefined ? d.total : '',
      d.review_status || 'PENDING',
      d.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnidoc_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatAmount = (val?: number | null) => {
    if (val === undefined || val === null) return '—';
    const converted = val * currencyRates[currency].rate;
    return `${currencyRates[currency].symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            REVIEW
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            PENDING
          </span>
        );
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100"><FileText className="w-4 h-4" /></div>;
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      {/* Table Controls & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All ({documents.length})</option>
              <option value="PASSED">Passed</option>
              <option value="WARNING">Warnings</option>
              <option value="NEEDS_MANUAL_REVIEW">Needs Review</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold shadow-2xs">
            {(['USD', 'EUR', 'GBP', 'BDT'] as const).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`px-2 py-1 rounded-lg transition ${
                  currency === curr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {currencyRates[curr].symbol} {curr}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl shadow-2xs transition"
            title="Export current table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && onBulkDelete && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-400">
            <tr>
              <th className="px-4 py-4 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-indigo-600 transition"
                  title="Select all"
                >
                  {selectedIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Type & Volume</th>
              <th className="px-6 py-4">Supplier / Context</th>
              <th className="px-6 py-4">Grand Total ({currency})</th>
              <th className="px-6 py-4">Validation State</th>
              <th className="px-6 py-4">Ingested At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No documents in current view</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try resetting filters or upload a new financial document.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <tr
                    key={doc.id}
                    className={`transition-colors group ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectOne(doc.id, e)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type)}
                        <div>
                          <Link
                            href={`/documents/${doc.id}`}
                            className="hover:text-indigo-600 transition block font-bold leading-tight"
                          >
                            {doc.filename}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">
                            {doc.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 uppercase text-[11px]">
                        {doc.file_type}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {doc.file_type === 'excel'
                          ? 'Spreadsheet'
                          : `${doc.page_count} Page${doc.page_count > 1 ? 's' : ''}`} • {(doc.file_size_bytes / 1024).toFixed(0)} KB
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {doc.supplier_name ? (
                        <div className="font-semibold text-slate-800 leading-snug">
                          {doc.supplier_name}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatAmount(doc.total)}
                    </td>

                    <td className="px-6 py-4">
                      {getBadge(doc.review_status)}
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {formatDate(doc.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100"
                          title="View & Inspect Document"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/documents/${doc.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition border border-transparent hover:border-amber-100"
                          title="Edit Extracted Fields & Line Items"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Confirm Single Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(modalTarget)}
        title="Delete Document?"
        message="Your document will be permanently deleted and cannot be recovered."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={Boolean(deletingId)}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deletingId && setModalTarget(null)}
      />

      {/* Centered Confirm Bulk Delete Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModal}
        title={`Delete ${selectedIds.length} Documents?`}
        message={`All ${selectedIds.length} selected documents, ledger records, extractions, and associated cross-verification results will be permanently purged from PostgreSQL.`}
        confirmText="Delete All"
        cancelText="Cancel"
        isLoading={deletingId === 'bulk'}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deletingId && setIsBulkDeleteModal(false)}
      />
    </div>
  );
}
