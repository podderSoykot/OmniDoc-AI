'use client';

import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  File, 
  X, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon,
  ArrowRight,
  Layers,
  HardDrive
} from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export default function DropZone({ onFilesSelected, isUploading }: DropZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-indigo-500" />;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  const totalSizeMB = (
    selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)
  ).toFixed(2);

  const supportedFormats = [
    { label: 'PDF Documents', desc: 'Up to 1,000 pgs', color: 'border-rose-200/80 bg-rose-50/50 text-rose-700' },
    { label: 'Scanned OCR', desc: 'PNG, JPG, TIFF', color: 'border-blue-200/80 bg-blue-50/50 text-blue-700' },
    { label: 'Financial Spreadsheets', desc: 'XLSX, XLS, CSV', color: 'border-emerald-200/80 bg-emerald-50/50 text-emerald-700' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Drop Zone Core Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99] shadow-inner'
            : 'border-slate-300/80 hover:border-indigo-500 bg-gradient-to-b from-slate-50/60 to-indigo-50/20 hover:from-indigo-50/40 hover:to-violet-50/30'
        }`}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-5 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white mb-5 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-10 h-10 animate-pulse" />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Drag and drop business documents here
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          or <span className="text-indigo-600 font-bold underline underline-offset-4 hover:text-indigo-700">browse local files</span> from your computer for instant asynchronous AI ingestion.
        </p>

        {/* Format Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {supportedFormats.map((fmt) => (
            <div 
              key={fmt.label} 
              className={`flex items-center gap-1.5 text-[11px] font-semibold border px-3 py-1 rounded-xl shadow-xs ${fmt.color}`}
            >
              <span>{fmt.label}</span>
              <span className="opacity-60 text-[10px]">({fmt.desc})</span>
            </div>
          ))}
        </div>

        <input
          type="file"
          ref={inputRef}
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Selected Ingestion Queue */}
      {selectedFiles.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <h4 className="text-xs uppercase font-black text-slate-700 tracking-wider">
                Staged for Batch Processing ({selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''})
              </h4>
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                Total payload: {totalSizeMB} MB
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition self-start sm:self-auto"
            >
              Clear Selected List
            </button>
          </div>

          {/* Scrollable File List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {selectedFiles.map((f, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0">
                    {getFileIcon(f.name)}
                  </div>
                  <div className="min-w-0">
                    <span className="truncate font-bold text-xs text-slate-900 block max-w-[200px] sm:max-w-[240px]">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleStartUpload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enqueuing Async Jobs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Start Batch Extraction Pipeline ({selectedFiles.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
