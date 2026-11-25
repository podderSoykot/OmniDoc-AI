import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export default function DropZone({ onFilesSelected, isUploading }: DropZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const supportedFormats = ['PDF (Up to 1000 pgs)', 'Scanned PNG/JPG', 'TIFF', 'Excel (XLSX, XLS)', 'CSV'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
        }`}
      >
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white mb-4 shadow-lg shadow-indigo-500/20">
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-base font-bold text-slate-800">
          Drop business documents here, or <span className="text-indigo-600 underline underline-offset-2">browse files</span>
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Multi-page PDFs, OCR invoices, receipts, and spreadsheets are automatically routed to processing pipelines.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
          {supportedFormats.map((fmt) => (
            <span key={fmt} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full shadow-xs">
              {fmt}
            </span>
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

      {selectedFiles.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
              Selected Ingestion Queue ({selectedFiles.length})
            </h4>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-400 hover:text-rose-500 transition font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl text-xs border border-slate-200/60 hover:bg-slate-100/60 transition">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 rounded bg-indigo-50 text-indigo-600">
                    <File className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="truncate font-semibold text-slate-800 block max-w-sm">{f.name}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartUpload}
            disabled={isUploading}
            className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isUploading ? 'Streaming & Running Extraction Pipelines...' : `Process ${selectedFiles.length} Document(s) Automatically`}
          </button>
        </div>
      )}
    </div>
  );
}
