'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { History, X, Clock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  documentId: string;
  filename: string;
  onClose: () => void;
}

export default function AuditTrailModal({ isOpen, documentId, filename, onClose }: AuditTrailModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      api.getAuditLogs(documentId)
        .then(setLogs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Audit Trail & Change History</h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-sm">{filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center space-y-1">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Original AI Ingestion State</p>
              <p className="text-[11px] text-slate-400">
                No manual field overrides have been made to this document yet.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <User className="w-3 h-3 text-slate-400" />
                    {log.modified_by}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(log.modified_at).toLocaleString()}
                  </span>
                </div>

                <div className="font-bold text-slate-800">
                  Modified Field: <span className="text-indigo-600 font-mono">{log.field_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Previous Value</span>
                    <span className="font-mono text-slate-600 truncate block mt-0.5">
                      {log.old_value || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Updated Value</span>
                    <span className="font-mono text-indigo-700 font-bold truncate block mt-0.5">
                      {log.new_value || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
