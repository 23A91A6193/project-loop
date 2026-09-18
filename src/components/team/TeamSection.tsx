'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  Copy,
  Check,
  Building2,
  Lock,
  Eye,
  Edit3,
  Shield,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../layout/Navbar';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  createdAt: string;
}

interface TeamSectionProps {
  currentUser: UserSession | null;
}

export const TeamSection: React.FC<TeamSectionProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [invitePassword, setInvitePassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch workspace members');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('loop_live_acme_secret_998877');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'ADMIN') {
      alert('⚠️ Forbidden: Only ADMIN role can invite or manage members (403)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          password: invitePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      setMembers((prev) => [...prev, data.member]);
      alert(`🎉 Member ${inviteName} added as ${inviteRole}!`);
      setInviteName('');
      setInviteEmail('');
      setIsInviteOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'ANALYST':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'VIEWER':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Workspace & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-400">
            Tenant isolation guarantees each workspace's data is strictly segregated. Manage teammates and access boundaries.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentUser?.role !== 'ADMIN') {
              alert('⚠️ Forbidden: Only ADMIN role can invite new members (403)');
              return;
            }
            setIsInviteOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Workspace Information & Webhook API Key */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workspace Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Tenant Workspace
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Active Tier: ENTERPRISE
            </span>
          </div>
          <div>
            <div className="text-lg font-black text-white">{currentUser?.tenantName || 'Acme Cloud Technologies'}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Workspace ID: <code className="text-indigo-300 font-mono">{currentUser?.tenantId || 'cmtjuvzyk0000i9itg2x9gae5'}</code>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All SQL queries carry <code className="text-indigo-300 font-mono">tenantId</code> scope. Cross-tenant access is strictly blocked at the route handler level.
          </p>
        </div>

        {/* API Ingestion Key */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Live Ingestion Webhook Key
            </span>
            <span className="text-[10px] font-mono text-slate-400">Header: x-api-key</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              readOnly
              value="loop_live_acme_secret_998877"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyApiKey}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Send raw feedback payloads via HTTP POST to <code className="text-cyan-400">/api/feedback</code> using this key to bypass browser session.
          </p>
        </div>
      </div>

      {/* RBAC Permission Matrix Reference Guide */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control Matrix (Zidio C2 Spec)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> ADMIN
            </div>
            <p className="text-[11px] text-slate-400">
              Full workspace rights: invite team members, manage RBAC roles, ingest feedback, reclassify, delete items, and generate VoC reports.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="font-bold text-blue-300 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" /> ANALYST
            </div>
            <p className="text-[11px] text-slate-400">
              Operations & Triage: Ingest feedback (single, CSV, simulate), triage status, trigger AI re-classification, delete items, and generate VoC reports.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> VIEWER
            </div>
            <p className="text-[11px] text-slate-400">
              Read-Only: View analytics dashboard, browse inbox, explore theme trends, and ask Q&A. Forbidden actions return 403.
            </p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Workspace Members ({members.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Current session: <span className="text-indigo-400 font-bold">{currentUser?.email}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading members...</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300 font-bold text-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{member.name}</span>
                      {member.email === currentUser?.email && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-300">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getRoleBadge(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Invite Teammate to Workspace
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Grant role-based access to your workspace. (Admin privilege required)
            </p>

            {errorMsg && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Samira Khan"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="samira@company.com"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ANALYST">Analyst (Ingest, triage, classify, reports)</option>
                  <option value="VIEWER">Viewer (Read-only access)</option>
                  <option value="ADMIN">Admin (Full administrative rights)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
