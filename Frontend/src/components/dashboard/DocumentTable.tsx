import React from 'react';
import Link from 'next/link';
import { DocumentItem } from '@/lib/types';
import { FileText, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface DocumentTableProps {
  documents: DocumentItem[];
}

export default function DocumentTable({ documents }: DocumentTableProps) {
  const getBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> PASSED</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle className="w-3 h-3" /> WARNING</span>;
      case 'NEEDS_MANUAL_REVIEW':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3" /> REVIEW NEEDED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200"><Clock className="w-3 h-3" /> {status || 'PENDING'}</span>;
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">Document</th>
            <th className="px-5 py-3">Type / Pages</th>
            <th className="px-5 py-3">Supplier</th>
            <th className="px-5 py-3">Total Amount</th>
            <th className="px-5 py-3">Validation Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                No documents found. Upload new documents to get started.
              </td>
            </tr>
          ) : (
            documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-xs" title={doc.filename}>{doc.filename}</span>
                </td>
                <td className="px-5 py-3.5 uppercase text-xs font-semibold text-slate-500">
                  {doc.file_type} • {doc.page_count} pgs
                </td>
                <td className="px-5 py-3.5 text-slate-700">
                  {doc.supplier_name || '—'}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">
                  {doc.total !== null && doc.total !== undefined ? `${doc.currency || '$'} ${doc.total.toFixed(2)}` : '—'}
                </td>
                <td className="px-5 py-3.5">
                  {getBadge(doc.review_status)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-md transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect & Edit
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
