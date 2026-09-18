'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  channel: string;
  sentiment: string | null;
  sentimentScore: number | null;
  category: string | null;
  urgencyScore: number | null;
  status: string;
  createdAt: string;
}

interface AnalyticsSectionProps {
  feedbacks: FeedbackItem[];
  onDrilldownCategory?: (category: string) => void;
  onDrilldownSentiment?: (sentiment: string) => void;
}

const SENTIMENT_COLORS = {
  POSITIVE: '#10b981', // emerald-500
  NEUTRAL: '#f59e0b',  // amber-500
  NEGATIVE: '#ef4444', // rose-500
};

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  feedbacks,
  onDrilldownCategory,
  onDrilldownSentiment,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter feedbacks by selected timeRange
  const now = Date.now();
  const filteredFeedbacks = feedbacks.filter((f) => {
    if (timeRange === 'all') return true;
    const itemDate = new Date(f.createdAt).getTime();
    const days = timeRange === '7d' ? 7 : 30;
    return itemDate >= now - days * 24 * 60 * 60 * 1000;
  });

  const totalCount = filteredFeedbacks.length;
  const positiveCount = filteredFeedbacks.filter((f) => f.sentiment === 'POSITIVE').length;
  const negativeCount = filteredFeedbacks.filter((f) => f.sentiment === 'NEGATIVE').length;
  const neutralCount = filteredFeedbacks.filter((f) => f.sentiment === 'NEUTRAL').length;

  const netSentimentScore = totalCount > 0
    ? Math.round(((positiveCount - negativeCount) / totalCount) * 100)
    : 0;

  const urgentCount = filteredFeedbacks.filter(
    (f) => (f.urgencyScore || 0) >= 4 && f.status !== 'ACTIONED'
  ).length;

  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newThisWeekCount = filteredFeedbacks.filter(
    (f) => new Date(f.createdAt).getTime() >= oneWeekAgo
  ).length;

  // Chart 1: Volume over time (grouped by day)
  const volumeByDateMap: { [dateStr: string]: { date: string; count: number; positive: number; negative: number } } = {};
  
  // Sort chronological
  const sorted = [...filteredFeedbacks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sorted.forEach((f) => {
    const d = new Date(f.createdAt);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    if (!volumeByDateMap[label]) {
      volumeByDateMap[label] = { date: label, count: 0, positive: 0, negative: 0 };
    }
    volumeByDateMap[label].count++;
    if (f.sentiment === 'POSITIVE') volumeByDateMap[label].positive++;
    if (f.sentiment === 'NEGATIVE') volumeByDateMap[label].negative++;
  });

  const timelineData = Object.values(volumeByDateMap);

  // Chart 2: Sentiment distribution
  const sentimentPieData = [
    { name: 'Positive', value: positiveCount, color: SENTIMENT_COLORS.POSITIVE },
    { name: 'Neutral', value: neutralCount, color: SENTIMENT_COLORS.NEUTRAL },
    { name: 'Negative', value: negativeCount, color: SENTIMENT_COLORS.NEGATIVE },
  ].filter((d) => d.value > 0);

  // Chart 3: Top Categories / Themes
  const categoryMap: { [cat: string]: { name: string; key: string; count: number; positive: number; negative: number } } = {};
  filteredFeedbacks.forEach((f) => {
    const rawKey = f.category || 'OTHER';
    const cat = rawKey.replace('_', ' ');
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, key: rawKey, count: 0, positive: 0, negative: 0 };
    }
    categoryMap[cat].count++;
    if (f.sentiment === 'POSITIVE') categoryMap[cat].positive++;
    if (f.sentiment === 'NEGATIVE') categoryMap[cat].negative++;
  });

  const categoryData = Object.values(categoryMap).sort((a, b) => b.count - a.count);

  // Chart 4: Channels distribution
  const channelMap: { [channel: string]: number } = {};
  filteredFeedbacks.forEach((f) => {
    const ch = f.channel ? f.channel.replace('_', ' ') : 'PORTAL';
    channelMap[ch] = (channelMap[ch] || 0) + 1;
  });

  const channelData = Object.entries(channelMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Executive Feedback Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Real-time analytics synthesized across all connected ingestion channels
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
          <span className="text-[11px] font-semibold text-slate-400 pr-1">Range:</span>
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeRange === range
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Feedback</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Active multi-channel ingestion
          </p>
        </div>

        {/* Card 2: Net Sentiment Score */}
        <div
          onClick={() => onDrilldownSentiment && onDrilldownSentiment('POSITIVE')}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Net Sentiment Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${netSentimentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netSentimentScore > 0 ? `+${netSentimentScore}` : netSentimentScore}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{positiveCount} Pos</span>
            <span className="text-amber-400 font-semibold">{neutralCount} Neu</span>
            <span className="text-rose-400 font-semibold">{negativeCount} Neg</span>
          </div>
        </div>

        {/* Card 3: Urgent Critical Issues */}
        <div
          onClick={() => onDrilldownSentiment && onDrilldownSentiment('NEGATIVE')}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Urgent Issues (L4-L5)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{urgentCount}</div>
          <p className="text-[11px] text-rose-400/80 mt-1 font-medium">
            Requires immediate triage
          </p>
        </div>

        {/* Card 4: New This Week */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">New This Week</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-300">{newThisWeekCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalCount > 0 ? `${Math.round((newThisWeekCount / totalCount) * 100)}% of total volume` : '0%'}
          </p>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume Over Time */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Feedback Volume Over Time</h3>
              <p className="text-xs text-slate-400">Daily ingested customer items</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-indigo-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Total Volume
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sentiment Breakdown Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Sentiment Distribution</h3>
              <p className="text-xs text-slate-400">Classified by AI (Click to drill down)</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {sentimentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    className="cursor-pointer"
                    onClick={(entry: any) => onDrilldownSentiment && onDrilldownSentiment(entry.name.toUpperCase())}
                  >
                    {sentimentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs">No sentiment data available</div>
            )}
          </div>
        </div>

        {/* Chart 3: Top Categories / Themes */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Top Themes & Categories</h3>
              <p className="text-xs text-slate-400">Ranked by volume (Click bar to drill down)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[0, 6, 6, 0]}
                  className="cursor-pointer"
                  onClick={(data: any) => onDrilldownCategory && onDrilldownCategory(data.key || data.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Channels Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Multi-Channel Ingestion Mix</h3>
              <p className="text-xs text-slate-400">Sources of customer interactions</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
