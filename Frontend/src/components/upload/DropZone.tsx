import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export default function DropZone({ onFilesSelected, isUploading }: DropZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center"
      >
        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mb-3">
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-base font-semibold text-slate-800">
          Click to upload or drag & drop files
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supported: Multi-page PDF, Scanned Images (JPG, PNG, TIFF), Excel (XLSX, XLS), CSV
        </p>
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
        <div className="mt-5">
          <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-200">
                <div className="flex items-center gap-2 truncate">
                  <File className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-700">{f.name}</span>
                  <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartUpload}
            disabled={isUploading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow transition disabled:opacity-50"
          >
            {isUploading ? 'Uploading & Processing...' : `Process ${selectedFiles.length} Document(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
