import React from 'react';

interface DocumentPreviewProps {
  documentId: string;
  fileType: string;
  filename: string;
}

export default function DocumentPreview({ documentId, fileType, filename }: DocumentPreviewProps) {
  const fileUrl = `http://localhost:8000/files/${documentId}.${fileType === 'excel' ? 'xlsx' : fileType}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 h-[780px] flex flex-col shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <h3 className="font-semibold text-sm text-slate-800 truncate" title={filename}>
          Preview: {filename}
        </h3>
        <span className="text-xs uppercase bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
          {fileType}
        </span>
      </div>

      <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
        {fileType === 'pdf' ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        ) : fileType === 'image' ? (
          <img
            src={fileUrl}
            alt={filename}
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          <div className="text-center p-6 text-slate-500">
            <p className="text-sm font-medium">Spreadsheet / Data Document</p>
            <p className="text-xs text-slate-400 mt-1">Structured tables extracted on the right panel.</p>
          </div>
        )}
      </div>
    </div>
  );
}
