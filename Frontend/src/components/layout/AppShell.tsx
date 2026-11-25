'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

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
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
