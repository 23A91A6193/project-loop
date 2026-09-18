'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Tag,
  Quote,
} from 'lucide-react';

interface ThemeItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  countThisWeek: number;
  countPrevWeek: number;
  trendPercentage: number;
  isSpiking: boolean;
  topQuotes: Array<{
    id: string;
    content: string;
    customerName: string | null;
    sentiment: string | null;
  }>;
}

interface ThemesSectionProps {
  onDrilldown: (categoryName: string) => void;
}

export const ThemesSection: React.FC<ThemesSectionProps> = ({ onDrilldown }) => {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/themes');
      if (!res.ok) throw new Error('Failed to fetch themes');
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (err: any) {
      setError(err.message || 'Error loading themes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const spikingThemes = themes.filter((t) => t.isSpiking);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            AI Theme Clustering & Trend Spike Detection
          </h2>
          <p className="text-xs text-slate-400">
            Unsupervised clustering of customer verbatim topics with automated week-over-week velocity tracking
          </p>
        </div>

        <button
          onClick={fetchThemes}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trends</span>
        </button>
      </div>

      {/* Spiking Alerts Banner */}
      {spikingThemes.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Spiking Issues Flagged (Emerging Trend Alert)</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            The AI engine detected significant velocity surges in the following themes this week versus previous period:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {spikingThemes.map((st) => (
              <button
                key={st.id}
                onClick={() => onDrilldown(st.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                <span>{st.name}</span>
                <span className="text-rose-300">+{st.trendPercentage}% WoW</span>
                <ArrowRight className="w-3 h-3 text-rose-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Themes Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Analyzing clustering algorithms & trends...</span>
        </div>
      ) : themes.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <div className="font-bold text-slate-300 text-sm">No themes clustered yet</div>
          <p className="text-xs text-slate-500 mt-1">Ingest feedback to enable automatic theme discovery</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme) => {
            const posPct = theme.totalCount > 0 ? Math.round((theme.positiveCount / theme.totalCount) * 100) : 0;
            const negPct = theme.totalCount > 0 ? Math.round((theme.negativeCount / theme.totalCount) * 100) : 0;
            const neuPct = 100 - posPct - negPct;

            return (
              <div
                key={theme.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{theme.name}</span>
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {theme.totalCount} items
                    </span>
                  </div>

                  {/* Description */}
                  {theme.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                      {theme.description}
                    </p>
                  )}

                  {/* Velocity & Spike Pill */}
                  <div className="flex items-center gap-2 mb-3">
                    {theme.isSpiking ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        <ArrowUpRight className="w-3 h-3" />
                        Spiking (+{theme.trendPercentage}% WoW)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Volume Stable
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {theme.countThisWeek} this week vs {theme.countPrevWeek} prev
                    </span>
                  </div>

                  {/* Sentiment Stacked Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-emerald-400">{posPct}% Pos</span>
                      <span className="text-amber-400">{neuPct}% Neu</span>
                      <span className="text-rose-400">{negPct}% Neg</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex">
                      <div style={{ width: `${posPct}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${neuPct}%` }} className="bg-amber-500 h-full" />
                      <div style={{ width: `${negPct}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  {/* Representative Verbatim Quote */}
                  {theme.topQuotes && theme.topQuotes.length > 0 && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 text-[11px] text-slate-300 italic flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        "{theme.topQuotes[0].content}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Drilldown Button */}
                <button
                  onClick={() => onDrilldown(theme.name)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <span>Drill Into Feedback</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
