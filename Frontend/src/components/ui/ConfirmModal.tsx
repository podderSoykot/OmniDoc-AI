'use client';

import React from 'react';

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
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[380px] bg-white rounded-3xl p-8 shadow-2xl border border-slate-100/80 text-center transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Playful Red Trash Can Illustration with Floating Particles */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-5">
          {/* Subtle soft red background glow */}
          <div className="absolute inset-0 bg-red-100/50 rounded-full blur-xl -z-10" />

          {/* Sparkle / Plus Accent Stars */}
          <span className="absolute top-1 left-4 text-red-400 font-bold text-xs select-none animate-pulse">✦</span>
          <span className="absolute top-2 right-4 text-red-500 font-bold text-xs select-none">✦</span>
          <span className="absolute bottom-6 left-1 text-red-400 font-black text-sm select-none">+</span>
          <span className="absolute bottom-6 right-2 text-red-400 font-bold text-xs select-none">•</span>

          {/* Clean Red Trash Can SVG Graphic */}
          <div className="relative flex flex-col items-center">
            {/* Tilted Lid with Handle */}
            <svg
              className="w-14 h-6 text-red-500 -mb-1 transform -rotate-12 transition-transform duration-300"
              viewBox="0 0 56 24"
              fill="currentColor"
            >
              {/* Lid Handle */}
              <rect x="22" y="2" width="12" height="5" rx="2.5" fill="currentColor" />
              {/* Lid Rim */}
              <rect x="4" y="9" width="48" height="7" rx="3.5" fill="currentColor" />
            </svg>

            {/* Trash Can Body with vertical slots */}
            <div className="w-11 h-12 bg-red-500 rounded-b-xl flex items-center justify-evenly px-2 pt-1.5 shadow-md shadow-red-500/20">
              <span className="w-1 h-8 bg-white rounded-full opacity-90" />
              <span className="w-1 h-8 bg-white rounded-full opacity-90" />
              <span className="w-1 h-8 bg-white rounded-full opacity-90" />
            </div>

            {/* Elliptical Ground Shadow */}
            <div className="w-16 h-1.5 bg-red-100 rounded-full mt-2" />
          </div>
        </div>

        {/* Modal Title */}
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h3>

        {/* Modal Description */}
        <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          {message}
        </p>

        {/* Action Buttons - 2 Side by Side */}
        <div className="mt-8 grid grid-cols-2 gap-3.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50/50 hover:border-red-300 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] shadow-md shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
