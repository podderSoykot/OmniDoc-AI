'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UploadCloud, 
  GitCompare, 
  Database, 
  ExternalLink, 
  Sparkles, 
  Menu, 
  X, 
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Batch Ingestion', icon: UploadCloud },
    { href: '/verification', label: 'Cross-Verification', icon: GitCompare },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            OmniDoc<span className="text-indigo-600">.AI</span>
          </span>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
            PRO
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 min-w-[16rem] bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Platform Identity */}
        <div>
          <div className="p-5 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white p-2.5 rounded-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900">
                    OmniDoc<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">.AI</span>
                  </span>
                  <span className="text-[9px] uppercase font-black tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200/60">
                    Enterprise
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Document Intelligence Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2">
                Main Menu
              </p>
              <nav className="space-y-1">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section: API Docs Link & Version */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 border border-slate-200/70 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="px-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span>OmniDoc v1.0 Enterprise</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
