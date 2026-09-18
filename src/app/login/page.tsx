'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Lock,
  Mail,
  CheckCircle2,
  Building2,
  TrendingUp,
  MessageSquareCode,
  FileText,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail.trim() || !targetPass.trim()) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    handleLogin(undefined, userEmail, pass);
  };

  return (
    <div className="min-h-screen bg-[#070d1e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient Gradient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-teal-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase mb-6 shadow-xl backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Project LOOP • AI Feedback Intelligence</span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-500/30">
            <div className="w-full h-full bg-[#070d1e] rounded-[14px] flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            LOOP<span className="text-indigo-400 font-mono text-xl ml-1">AI</span>
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Close the loop on customer feedback. Multi-tenant intelligence platform with grounded Q&A, automated theme clustering, and VoC digests.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#0b1227]/90 backdrop-blur-2xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/[0.08] relative overflow-hidden">
          {/* Top Subtle Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center gap-3 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#0b1227] px-3 text-slate-400">
                1-Click RBAC Demo Logins (Zidio Rubric)
              </span>
            </div>
          </div>

          {/* 1-Click Demo Accounts (Admin, Analyst, Viewer) */}
          <div className="grid grid-cols-3 gap-2">
            {/* Admin */}
            <button
              type="button"
              onClick={() => quickLogin('admin@acme.com', 'password123')}
              className="flex flex-col items-start p-2.5 bg-slate-950/70 border border-slate-800 hover:border-purple-500/60 hover:bg-purple-950/20 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">
                  Admin
                </span>
                <span className="text-[8px] font-bold px-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Full
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-200 truncate w-full">
                Ranjith M.
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">Admin / Lead</span>
            </button>

            {/* Analyst */}
            <button
              type="button"
              onClick={() => quickLogin('analyst@acme.com', 'password123')}
              className="flex flex-col items-start p-2.5 bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 hover:bg-blue-950/20 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                  Analyst
                </span>
                <span className="text-[8px] font-bold px-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Triage
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-200 truncate w-full">
                Renuka B.
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">Analyst / Co-Dev</span>
            </button>

            {/* Viewer */}
            <button
              type="button"
              onClick={() => quickLogin('viewer@acme.com', 'password123')}
              className="flex flex-col items-start p-2.5 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-950/20 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                  Viewer
                </span>
                <span className="text-[8px] font-bold px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Read
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-200 truncate w-full">
                Alex W.
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">403 on edit</span>
            </button>
          </div>

          {/* Feature Highlights Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-indigo-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-Tenant Data Isolation (Workspace Scoped)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Grounded Q&A (RAG) & Verbatim Citations</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Week-over-Week Theme Spike Detection & VoC Briefs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
