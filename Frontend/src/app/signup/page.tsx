'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Database, 
  Building2,
  Server
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.signup(email, password, fullName);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
              Create Your Isolated Corporate Workspace
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Register now to access enterprise-grade document intelligence. Process invoices, run OCR, compare PDF against Excel registers, and keep your data 100% confidential.
            </p>
          </div>

          {/* Guarantee Checklist */}
          <div className="space-y-3 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Private Multi-Tenant Sandbox</p>
                <p className="text-[11px] text-slate-400">Your documents are strictly foreign-keyed and isolated from other users.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Automated Cross-Verification</p>
                <p className="text-[11px] text-slate-400">Multi-page PDF-to-PDF and PDF-to-Excel 3-way line item match and tolerance audit.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Audit Trail & Corrections</p>
                <p className="text-[11px] text-slate-400">Track all manual modifications, math recalculations, and historical audit logs.</p>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Instant Tenant Provisioning</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-6">
          <span>&copy; {new Date().getFullYear()} OmniDoc-AI Systems</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Server className="w-3.5 h-3.5" /> PostgreSQL High Security
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
              Create Enterprise Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Set up your profile to activate an isolated document intelligence tenant.
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Soykot Podder"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Workspace...</span>
                </div>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an enterprise account?{' '}
            <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition">
              Sign In Instead
            </Link>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Multi-Tenant Guarantee: All data registered under this tenant remains strictly private.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
