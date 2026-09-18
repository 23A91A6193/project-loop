'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Radio,
  RefreshCw,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  CheckCheck,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { UserSession } from '../layout/Navbar';

interface FeedbackItem {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  channel: string;
  rating: number | null;
  content: string;
  status: 'NEW' | 'REVIEWED' | 'ACTIONED';
  isAnalyzed: boolean;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null;
  sentimentScore: number | null;
  sentimentRationale: string | null;
  category: string | null;
  urgencyScore: number | null;
  actionSuggestion: string | null;
  createdAt: string;
  themes?: Array<{ theme: { id: string; name: string; color: string } }>;
}

interface FeedbackInboxProps {
  currentUser: UserSession | null;
  onRefreshStats?: () => void;
  initialCategory?: string;
  initialSentiment?: string;
  initialSearch?: string;
}

export const FeedbackInboxSection: React.FC<FeedbackInboxProps> = ({
  currentUser,
  onRefreshStats,
  initialCategory,
  initialSentiment,
  initialSearch,
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filters & Pagination State
  const [search, setSearch] = useState(initialSearch || '');
  const [sentimentFilter, setSentimentFilter] = useState(initialSentiment || 'ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (initialCategory !== undefined) setCategoryFilter(initialCategory);
    if (initialSentiment !== undefined) setSentimentFilter(initialSentiment);
    if (initialSearch !== undefined) setSearch(initialSearch);
    setPage(1);
  }, [initialCategory, initialSentiment, initialSearch]);

  // Modals
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Single Add Form
  const [singleContent, setSingleContent] = useState('');
  const [singleChannel, setSingleChannel] = useState('PORTAL');
  const [singleCustomerName, setSingleCustomerName] = useState('');
  const [singleCustomerEmail, setSingleCustomerEmail] = useState('');
  const [singleRating, setSingleRating] = useState('5');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvSummary, setCsvSummary] = useState<{ imported: number; failed: number } | null>(null);

  // Action Loading states
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sentiment: sentimentFilter,
        channel: channelFilter,
        category: categoryFilter,
        status: statusFilter,
        dateRange: dateRangeFilter,
      });

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch feedback: ${res.statusText}`);
      }
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading feedback inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [page, limit, search, sentimentFilter, channelFilter, categoryFilter, statusFilter, dateRangeFilter]);

  // Inline status update (NEW -> REVIEWED -> ACTIONED)
  const handleStatusChange = async (id: string, newStatus: 'NEW' | 'REVIEWED' | 'ACTIONED') => {
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers have read-only access (403)');
      return;
    }

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 403) {
        showToast('⚠️ Forbidden: Viewers cannot modify feedback status (403)');
        return;
      }

      if (!res.ok) throw new Error('Status update failed');

      setFeedbacks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast(`Status updated to ${newStatus}`);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Re-classify feedback (AI1)
  const handleReclassify = async (id: string) => {
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers cannot trigger re-classification (403)');
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'POST',
      });

      if (res.status === 403) {
        showToast('⚠️ Forbidden: Viewers cannot re-classify feedback (403)');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Re-classification failed');

      setFeedbacks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data.feedback } : item))
      );
      showToast('✨ AI re-classification complete!');
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Delete feedback item
  const handleDelete = async (id: string) => {
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers cannot delete feedback items (403)');
      return;
    }

    if (!confirm('Are you sure you want to delete this customer feedback item?')) return;

    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });

      if (res.status === 403) {
        showToast('⚠️ Forbidden: Viewers cannot delete items (403)');
        return;
      }

      if (!res.ok) throw new Error('Failed to delete item');

      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      showToast('Item deleted successfully');
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Submit Single Feedback Form (C3)
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers cannot ingest feedback (403)');
      return;
    }

    if (!singleContent.trim()) {
      alert('Feedback content is required');
      return;
    }

    setIsSubmittingSingle(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: singleContent,
          channel: singleChannel,
          customerName: singleCustomerName || undefined,
          customerEmail: singleCustomerEmail || undefined,
          rating: singleRating ? parseInt(singleRating) : undefined,
        }),
      });

      if (res.status === 403) {
        showToast('⚠️ Forbidden: Viewers cannot submit new feedback (403)');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');

      showToast('🎉 Feedback ingested & AI-classified!');
      setSingleContent('');
      setSingleCustomerName('');
      setSingleCustomerEmail('');
      setIsSingleAddOpen(false);
      fetchFeedbacks();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // CSV File Handler (C3)
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data.slice(0, 5));
      },
    });
  };

  // Upload CSV (C3)
  const handleUploadCsv = async () => {
    if (!csvFile) return;
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers cannot upload CSV files (403)');
      return;
    }

    setIsUploadingCsv(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/feedback/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rows: results.data,
              autoAnalyze: true,
            }),
          });

          if (res.status === 403) {
            showToast('⚠️ Forbidden: Viewers cannot upload CSV datasets (403)');
            setIsUploadingCsv(false);
            return;
          }

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'CSV upload failed');

          setCsvSummary({
            imported: data.insertedCount || 0,
            failed: data.failedCount || 0,
          });
          showToast(`CSV Processed: ${data.insertedCount} imported, ${data.failedCount} failed.`);
          fetchFeedbacks();
          if (onRefreshStats) onRefreshStats();
        } catch (err: any) {
          alert(`CSV Ingestion Error: ${err.message}`);
        } finally {
          setIsUploadingCsv(false);
        }
      },
    });
  };

  // Simulated Channel Sync (C3)
  const handleSimulateSync = async (channelKey: 'ZENDESK' | 'APP_STORE' | 'G2_COMMUNITY') => {
    if (currentUser?.role === 'VIEWER') {
      showToast('⚠️ Forbidden: Viewers cannot trigger channel sync (403)');
      return;
    }

    try {
      const res = await fetch('/api/feedback/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: channelKey }),
      });

      if (res.status === 403) {
        showToast('⚠️ Forbidden: Viewers cannot trigger channel sync (403)');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');

      showToast(`⚡ ${data.message}`);
      setIsSimulateModalOpen(false);
      fetchFeedbacks();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const getSentimentPill = (sentiment: string | null, score: number | null) => {
    switch (sentiment) {
      case 'POSITIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            Positive {score !== null && `(${score > 0 ? `+${score}` : score})`}
          </span>
        );
      case 'NEGATIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            Negative {score !== null && `(${score})`}
          </span>
        );
      case 'NEUTRAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            Neutral {score !== null && `(${score})`}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIONED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'REVIEWED':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'NEW':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/50 text-white shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Feedback Triage Inbox
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {totalRecords} items
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Search, filter, and triage incoming multi-channel customer feedback with AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate Channel Button */}
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Channel</span>
          </button>

          {/* Bulk CSV Upload Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk CSV Import</span>
          </button>

          {/* Add Single Feedback Button */}
          <button
            onClick={() => setIsSingleAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single Feedback</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search feedback text, customer names, or emails..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Channel */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Channel</label>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="SUPPORT_TICKET">Support Ticket</option>
              <option value="APP_STORE">App Store (iOS)</option>
              <option value="PLAY_STORE">Google Play</option>
              <option value="NPS_SURVEY">NPS Survey</option>
              <option value="SALES_CALL">Sales Call Note</option>
              <option value="COMMUNITY">Community / Twitter</option>
              <option value="PORTAL">Web Portal</option>
              <option value="CSV_IMPORT">CSV Import</option>
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive Only</option>
              <option value="NEUTRAL">Neutral Only</option>
              <option value="NEGATIVE">Negative Only</option>
            </select>
          </div>

          {/* Theme / Category */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="BUG">Bugs & Crashes</option>
              <option value="PERFORMANCE">Performance & Latency</option>
              <option value="BILLING">Billing & Pricing</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="UI_UX">UI / UX Design</option>
              <option value="OTHER">Other / General</option>
            </select>
          </div>

          {/* Status Workflow */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Unreviewed)</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTIONED">Actioned (Resolved)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Timeframe</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Dates</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filters / Reset Bar */}
        {(search || sentimentFilter !== 'ALL' || channelFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || dateRangeFilter !== 'all') && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 flex-wrap text-slate-300">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active:</span>
              {search && (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 text-[11px]">
                  Search: "{search}"
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 text-[11px]">
                  Category: {categoryFilter}
                </span>
              )}
              {sentimentFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-[11px]">
                  Sentiment: {sentimentFilter}
                </span>
              )}
              {channelFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                  Channel: {channelFilter}
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                  Status: {statusFilter}
                </span>
              )}
              {dateRangeFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                  Timeframe: {dateRangeFilter}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSentimentFilter('ALL');
                setChannelFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setDateRangeFilter('all');
                setPage(1);
              }}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition cursor-pointer flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback List Container */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading feedback records...</span>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="font-bold text-slate-300 text-sm">No feedback matches your filters</div>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-5 hover:bg-slate-800/30 transition-all duration-150 space-y-3"
              >
                {/* Header Row: Channel, Customer, Sentiment, Urgency, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 uppercase tracking-wider">
                      {fb.channel.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {fb.customerName || 'Anonymous Customer'}
                    </span>
                    {fb.customerEmail && (
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        ({fb.customerEmail})
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sentiment Pill */}
                    {getSentimentPill(fb.sentiment, fb.sentimentScore)}

                    {/* Urgency Pill if high */}
                    {(fb.urgencyScore || 0) >= 4 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Urgency L{fb.urgencyScore}
                      </span>
                    )}

                    {/* Inline Status Workflow Dropdown */}
                    <div className="flex items-center gap-1">
                      <select
                        value={fb.status}
                        onChange={(e) => handleStatusChange(fb.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(
                          fb.status
                        )}`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ACTIONED">ACTIONED</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed">
                  "{fb.content}"
                </p>

                {/* AI Rationale & Action Recommendation Strip */}
                {(fb.actionSuggestion || fb.sentimentRationale || fb.category) && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="space-y-1">
                      {fb.category && (
                        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                          <Tag className="w-3 h-3" />
                          <span>Category: {fb.category.replace('_', ' ')}</span>
                          {fb.sentimentRationale && (
                            <span className="text-slate-400 font-normal">
                              — {fb.sentimentRationale}
                            </span>
                          )}
                        </div>
                      )}
                      {fb.actionSuggestion && (
                        <div className="text-slate-300 font-medium">
                          <span className="text-emerald-400 font-bold">Suggested Action: </span>
                          {fb.actionSuggestion}
                        </div>
                      )}
                    </div>

                    {/* Inline Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleReclassify(fb.id)}
                        disabled={processingId === fb.id}
                        title="Re-classify with AI"
                        className="px-2 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${processingId === fb.id ? 'animate-spin' : ''}`} />
                        <span>Re-Classify</span>
                      </button>

                      <button
                        onClick={() => handleDelete(fb.id)}
                        title="Delete Feedback"
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Server-side Pagination Strip */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing Page <span className="font-bold text-white">{page}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span> ({totalRecords} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Single Feedback Ingestion */}
      {isSingleAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsSingleAddOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-indigo-400" />
              Ingest Single Customer Feedback
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Input customer quote or review. AI will classify sentiment and category automatically.
            </p>

            <form onSubmit={handleCreateSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Feedback Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  placeholder="e.g. The new checkout flow is confusing on mobile..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Channel Source
                  </label>
                  <select
                    value={singleChannel}
                    onChange={(e) => setSingleChannel(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="PORTAL">Web Portal</option>
                    <option value="SUPPORT_TICKET">Support Ticket</option>
                    <option value="APP_STORE">App Store (iOS)</option>
                    <option value="PLAY_STORE">Google Play</option>
                    <option value="NPS_SURVEY">NPS Survey</option>
                    <option value="SALES_CALL">Sales Call Note</option>
                    <option value="COMMUNITY">Community / Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rating (1 to 5)
                  </label>
                  <select
                    value={singleRating}
                    onChange={(e) => setSingleRating(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terrible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={singleCustomerName}
                    onChange={(e) => setSingleCustomerName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={singleCustomerEmail}
                    onChange={(e) => setSingleCustomerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSingle}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-indigo-600/30"
              >
                {isSubmittingSingle ? 'Analyzing & Ingesting...' : 'Ingest & Run AI Classifier'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk CSV Upload */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsCsvModalOpen(false);
                setCsvSummary(null);
                setCsvPreview([]);
                setCsvFile(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Upload className="w-5 h-5 text-emerald-400" />
              Bulk CSV Ingestion Pipeline
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Upload customer feedback CSV. Required header: <code className="text-indigo-300">content</code>. Optional: channel, customerName, rating.
            </p>

            {csvSummary ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-emerald-300">CSV Import Completed</div>
                <div className="text-xs text-slate-300">
                  Successfully imported: <span className="font-bold text-white">{csvSummary.imported}</span> | Failed:{' '}
                  <span className="font-bold text-rose-400">{csvSummary.failed}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCsvModalOpen(false);
                    setCsvSummary(null);
                    setCsvFile(null);
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-950 file:text-indigo-300 hover:file:bg-indigo-900 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Supports exports from Zendesk, Intercom, App Store, Google Forms, and Jira
                  </p>
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Data Preview (First 5 rows):
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 max-h-36 overflow-y-auto space-y-1.5 font-mono">
                      {csvPreview.map((row, i) => (
                        <div key={i} className="truncate border-b border-slate-900 pb-1">
                          #{i + 1}: "{row.content || row.feedback || row.text || 'No content'}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUploadCsv}
                  disabled={!csvFile || isUploadingCsv}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {isUploadingCsv ? 'Parsing & Ingesting...' : 'Start Bulk Import & AI Classification'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Simulate Channel Integration */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsSimulateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              Simulate Live Channel Ingestion
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Simulate pulling real-time customer data from enterprise channels with immediate AI triage.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleSimulateSync('ZENDESK')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                    Sync Zendesk Support Tickets
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">
                    Simulate
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pulls technical support tickets regarding SAML SSO redirects and CSV export timeouts.
                </p>
              </button>

              <button
                onClick={() => handleSimulateSync('APP_STORE')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                    Sync iOS & Play Store Reviews
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                    Simulate
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fetches mobile application app store reviews with 1-5 star ratings and crash diagnostics.
                </p>
              </button>

              <button
                onClick={() => handleSimulateSync('G2_COMMUNITY')}
                className="w-full p-4 rounded-2xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-purple-300">
                    Sync G2 & Community Mentions
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300">
                    Simulate
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gathers public software review quotes, feature requests, and SaaS community feedback.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
