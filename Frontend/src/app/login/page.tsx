'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  FileCheck2, 
  CheckCircle, 
  Zap, 
  Server
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950">
      {/* Left Hero / Brand Showcase (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800/60">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              OmniDoc<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">.AI</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Enterprise v1.0
            </span>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              AI-Powered Financial Intelligence & Document Integrity
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Automated multi-page PDF extraction, OCR scanning, 3-way line item cross-verification, and ledger reconciliation with strict multi-tenant data isolation.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Zero-Trust Isolation</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                User records, documents, and cross-checks are strictly isolated per tenant.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">100% Accuracy</p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Strict mathematical audit and tolerance-checked multi-sheet ledger cross-matching.
              </p>
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI Core & PostgreSQL (Port 5433) Active</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          <span>&copy; {new Date().getFullYear()} OmniDoc-AI Systems</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Server className="w-3.5 h-3.5" /> High Availability Cluster
          </span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Top Brand (visible on small screens) */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white">
              OmniDoc<span className="text-indigo-400">.AI</span>
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your credentials to access your protected document intelligence ledger.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Quick Demo Accounts:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('alice_corp@example.com')}
                  className="text-[10px] font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition"
                >
                  Alice (Manager)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('bob_corp@example.com')}
                  className="text-[10px] font-bold px-2 py-1 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/30 rounded-lg transition"
                >
                  Bob (Auditor)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Need an enterprise account?{' '}
            <Link href="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition">
              Create New Account
            </Link>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Tenant Protection Guarantee: Your financial records remain encrypted and inaccessible to other users.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
