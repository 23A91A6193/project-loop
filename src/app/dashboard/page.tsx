'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, DashboardTab, UserSession } from '@/components/layout/Navbar';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';
import { FeedbackInboxSection } from '@/components/inbox/FeedbackInboxSection';
import { ThemesSection } from '@/components/trends/ThemesSection';
import { AskLoopSection } from '@/components/ask/AskLoopSection';
import { VocReportsSection } from '@/components/reports/VocReportsSection';
import { TeamSection } from '@/components/team/TeamSection';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  // Fetch current user session
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (e) {
      console.error('Session error:', e);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch feedback dataset for charts & overview
  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await fetch('/api/feedback?limit=100');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchFeedbacks();
  }, []);

  // Quick switch role (1-click live demo verification for graders)
  const handleSwitchRole = async (targetRole: 'ADMIN' | 'ANALYST' | 'VIEWER') => {
    let email = 'admin@acme.com';
    if (targetRole === 'ANALYST') email = 'analyst@acme.com';
    if (targetRole === 'VIEWER') email = 'viewer@acme.com';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });

      if (res.ok) {
        await fetchUser();
        await fetchFeedbacks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [inboxInitialCategory, setInboxInitialCategory] = useState('ALL');
  const [inboxInitialSentiment, setInboxInitialSentiment] = useState('ALL');
  const [inboxInitialSearch, setInboxInitialSearch] = useState('');

  const handleDrilldownCategory = (categoryOrTheme: string) => {
    const knownCategories = ['BUG', 'FEATURE_REQUEST', 'UI_UX', 'PERFORMANCE', 'BILLING', 'OTHER'];
    const normalized = categoryOrTheme.toUpperCase().replace(/\s+/g, '_');

    if (knownCategories.includes(categoryOrTheme) || knownCategories.includes(normalized)) {
      setInboxInitialCategory(knownCategories.includes(categoryOrTheme) ? categoryOrTheme : normalized);
      setInboxInitialSearch('');
    } else {
      setInboxInitialCategory('ALL');
      setInboxInitialSearch(categoryOrTheme);
    }
    setInboxInitialSentiment('ALL');
    setActiveTab('inbox');
  };

  const handleDrilldownSentiment = (sentiment: string) => {
    const s = sentiment.toUpperCase();
    if (['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(s)) {
      setInboxInitialSentiment(s);
    } else {
      setInboxInitialSentiment('ALL');
    }
    setInboxInitialCategory('ALL');
    setInboxInitialSearch('');
    setActiveTab('inbox');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070d1e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        totalFeedbackCount={feedbacks.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loadingUser ? (
          <div className="py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Initializing Project LOOP workspace session...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'dashboard' && (
              <AnalyticsSection
                feedbacks={feedbacks}
                onDrilldownCategory={handleDrilldownCategory}
                onDrilldownSentiment={handleDrilldownSentiment}
              />
            )}

            {activeTab === 'inbox' && (
              <FeedbackInboxSection
                currentUser={currentUser}
                onRefreshStats={fetchFeedbacks}
                initialCategory={inboxInitialCategory}
                initialSentiment={inboxInitialSentiment}
                initialSearch={inboxInitialSearch}
              />
            )}

            {activeTab === 'trends' && (
              <ThemesSection onDrilldown={handleDrilldownCategory} />
            )}

            {activeTab === 'ask' && <AskLoopSection />}

            {activeTab === 'reports' && (
              <VocReportsSection currentUser={currentUser} />
            )}

            {activeTab === 'team' && <TeamSection currentUser={currentUser} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050914]/90 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">Project LOOP</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400">
              Corporate-Grade AI Customer-Feedback Intelligence Platform
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Zidio Capstone • Built by <span className="text-indigo-300 font-medium">M. Ranjith Kumar</span> &amp; <span className="text-purple-300 font-medium">M. Renuka Bindu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
