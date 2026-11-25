import React from 'react';
import { ExternalLink, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentPreviewProps {
  documentId: string;
  fileType: string;
  filename: string;
}

export default function DocumentPreview({ documentId, fileType, filename }: DocumentPreviewProps) {
  const fileUrl = `http://localhost:8000/files/${documentId}.${fileType === 'excel' ? 'xlsx' : fileType}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 h-[780px] flex flex-col shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            {fileType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 truncate max-w-xs" title={filename}>
              {filename}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Live Source Preview</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={fileUrl}
            download={filename}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition"
            title="Download original file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 bg-slate-100/70 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/50">
        {fileType === 'pdf' ? (
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full border-0 rounded-xl"
            title="PDF Preview"
          />
        ) : fileType === 'image' ? (
          <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
            <img
              src={fileUrl}
              alt={filename}
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 inline-block mb-3 shadow-xs">
              <FileText className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">Tabular Data Document</p>
            <p className="text-xs text-slate-400 mt-1">
              Spreadsheets are structured directly into field records on the right panel.
            </p>
            <a
              href={fileUrl}
              download={filename}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Spreadsheet
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
