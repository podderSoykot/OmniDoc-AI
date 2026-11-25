'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Accent Bar */}
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5 text-rose-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all disabled:opacity-50 ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              }`}
            >
              {isLoading && (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
