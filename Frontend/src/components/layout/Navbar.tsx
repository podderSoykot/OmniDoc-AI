import Link from 'next/link';
import { FileText, Upload, GitCompare, Search, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            OmniDoc<span className="text-indigo-600">.AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/upload" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            Upload Batch
          </Link>
          <Link href="/verification" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
            <GitCompare className="w-4 h-4" />
            Cross-Verification
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium transition"
          >
            API Swagger
          </a>
        </nav>
      </div>
    </header>
  );
}
