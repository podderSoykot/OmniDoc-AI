'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Upload, GitCompare, ExternalLink, Sparkles, Database } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: FileText },
    { href: '/upload', label: 'Batch Ingestion', icon: Upload },
    { href: '/verification', label: 'Cross-Verification', icon: GitCompare },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white p-2.5 rounded-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                OmniDoc<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200/60">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-1 hidden sm:block">
              Intelligent Financial Document System
            </p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Database Status & Swagger link */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600" />
            <span>PostgreSQL: 5433</span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
