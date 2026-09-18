'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageSquareCode,
  FileText,
  Users,
  LogOut,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

export type DashboardTab = 'dashboard' | 'inbox' | 'trends' | 'ask' | 'reports' | 'team';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  tenantId: string;
  tenantName: string;
}

interface NavbarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  currentUser: UserSession | null;
  onSwitchRole?: (role: 'ADMIN' | 'ANALYST' | 'VIEWER') => void;
  totalFeedbackCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchRole,
  totalFeedbackCount,
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    document.cookie = 'loop_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'inbox',
      label: 'Feedback Inbox',
      icon: <Inbox className="w-4 h-4" />,
      badge: totalFeedbackCount !== undefined ? totalFeedbackCount : undefined,
    },
    {
      id: 'trends',
      label: 'Themes & Trends',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'AI',
    },
    {
      id: 'ask',
      label: 'Ask LOOP',
      icon: <MessageSquareCode className="w-4 h-4" />,
      badge: 'RAG',
    },
    {
      id: 'reports',
      label: 'VoC Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'team',
      label: 'Team & RBAC',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  const getRoleBadgeStyle = (role?: string) => {
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
    <header className="sticky top-0 z-40 bg-[#070d1e]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-lg w-full">
      {/* Top Header: Branding, Workspace, Role Switcher, User, and Logout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Workspace */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#070d1e] rounded-[14px] flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  LOOP<span className="text-indigo-400 text-xs px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 font-mono">AI</span>
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[150px]">
                    {currentUser?.tenantName || 'Acme Cloud Technologies'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">
                AI Customer-Feedback Intelligence Platform
              </p>
            </div>
          </div>

          {/* Right: Role Switcher, User Profile, and Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* 1-Click Role Switcher for RBAC Testing */}
            {onSwitchRole && (
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 hidden sm:inline">Role:</span>
                {(['ADMIN', 'ANALYST', 'VIEWER'] as const).map((r) => {
                  const isCurrent = currentUser?.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => onSwitchRole(r)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        isCurrent
                          ? r === 'ADMIN'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : r === 'ANALYST'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title={`Switch to ${r} role for live verification`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Current User Badge */}
            <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                  {currentUser?.name || 'User'}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                      currentUser?.role
                    )}`}
                  >
                    {currentUser?.role || 'ANALYST'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 text-xs font-bold transition cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-800/80 bg-[#060b1b]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'AI' || item.badge === 'RAG'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
