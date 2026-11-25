'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UploadCloud, 
  GitCompare, 
  Sparkles, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut, 
  UserCheck,
  ChevronDown,
  BarChart3,
  AlertTriangle,
  FolderOpen,
  Layers,
  AlertOctagon
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthGuard';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [batchOpen, setBatchOpen] = useState(true);
  const { user, logout } = useAuth();

  const isDashboardActive = pathname === '/' || pathname === '/analytics' || pathname === '/review-queue';
  const isBatchActive = pathname === '/upload' || pathname === '/upload/queue' || pathname === '/upload/failed';

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 transition shadow-2xs"
            title="Sign Out of Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 min-w-[16rem] shrink-0 bg-white border-r border-slate-200/80 z-40 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Logo & Platform Identity (Scrollable Menu) */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
          <div className="p-4 space-y-4">
            <div>
              <p className="px-3 text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2">
                Workspace Menu
              </p>

              <nav className="space-y-1">
                {/* 1. Dashboard Accordion with Sub-Pages */}
                <div>
                  <button
                    type="button"
                    onClick={() => setDashboardOpen(!dashboardOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isDashboardActive
                        ? 'text-indigo-900 bg-indigo-50/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>Dashboard</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dashboardOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Nested Sub-Pages */}
                  {dashboardOpen && (
                    <div className="pl-6 pr-1 pt-1 pb-1 space-y-1 border-l-2 border-indigo-100 ml-4 mt-1">
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>All Documents</span>
                      </Link>

                      <Link
                        href="/analytics"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/analytics'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Analytics Overview</span>
                      </Link>

                      <Link
                        href="/review-queue"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/review-queue'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Review Queue</span>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-rose-100 text-rose-700">
                          Alerts
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. Batch Ingestion Accordion with Sub-Pages */}
                <div>
                  <button
                    type="button"
                    onClick={() => setBatchOpen(!batchOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isBatchActive
                        ? 'text-indigo-900 bg-indigo-50/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UploadCloud className={`w-4 h-4 ${isBatchActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>Batch Ingestion</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${batchOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Nested Sub-Pages */}
                  {batchOpen && (
                    <div className="pl-6 pr-1 pt-1 pb-1 space-y-1 border-l-2 border-indigo-100 ml-4 mt-1">
                      <Link
                        href="/upload"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/upload'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Dropzone</span>
                      </Link>

                      <Link
                        href="/upload/queue"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/upload/queue'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Processing Queue</span>
                      </Link>

                      <Link
                        href="/upload/failed"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          pathname === '/upload/failed'
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                          <span>Failed & Retries</span>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-rose-100 text-rose-700">
                          Retry
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. Cross-Verification */}
                <Link
                  href="/verification"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/verification'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <GitCompare className={`w-4 h-4 ${pathname === '/verification' ? 'text-white' : 'text-slate-400'}`} />
                  <span>Cross-Verification</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section: User Session & Logout (Always visible & pinned) */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-white space-y-3">
          {/* Logged-in User Profile Pill */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-indigo-500/20">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || 'Active Session'}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {user?.email || 'Authenticated User'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-lg">
              <UserCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">Isolated Workspace Active</span>
            </div>

            {/* Clear, Prominent Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 rounded-xl transition-all shadow-2xs group cursor-pointer"
              title="Sign Out of Workspace"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Sign Out / Log Out</span>
            </button>
          </div>

          {/* Tenant Status Footer */}
          <div className="px-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
            <span>OmniDoc Enterprise</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3 h-3" />
              <span>Multi-Tenant</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
