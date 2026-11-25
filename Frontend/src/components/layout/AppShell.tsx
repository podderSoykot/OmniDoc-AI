'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { AuthGuard, useAuth } from '@/components/auth/AuthGuard';
import { LogOut, ShieldCheck } from 'lucide-react';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard Overview';
    if (path === '/analytics') return 'Executive Financial Analytics';
    if (path === '/review-queue') return 'Manual Review Queue';
    if (path === '/upload') return 'Batch Document Ingestion';
    if (path === '/upload/queue') return 'Task Processing Queue';
    if (path === '/upload/failed') return 'Failed Jobs & Retries';
    if (path === '/verification') return 'Cross-Document Verification';
    if (path.startsWith('/documents/')) return 'Document Inspection & Audit';
    return 'Workspace';
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {getPageTitle(pathname || '')}
            </h2>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Session Secure</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl text-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-900">{user?.full_name || 'User'}</span>
              <span className="text-slate-400 text-[11px]">({user?.email || 'authenticated'})</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all shadow-2xs group cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  return (
    <AuthGuard>
      {isAuthPage ? (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
          {children}
        </div>
      ) : (
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
      )}
    </AuthGuard>
  );
}
