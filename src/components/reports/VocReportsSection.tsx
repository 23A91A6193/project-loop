'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Copy,
  Check,
  Calendar,
  Layers,
  AlertOctagon,
  Award,
  ListOrdered,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { UserSession } from '../layout/Navbar';

interface VocReportItem {
  id: string;
  title: string;
  timeRange: string;
  totalFeedbacks: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  netSentimentScore: number;
  topThemes: string;
  keyStrengths: string;
  criticalIssues: string;
  executiveSummary: string;
  actionPlan: string;
  createdBy: string;
  createdAt: string;
}

interface VocReportsSectionProps {
  currentUser: UserSession | null;
}

export const VocReportsSection: React.FC<VocReportsSectionProps> = ({ currentUser }) => {
  const [reports, setReports] = useState<VocReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<VocReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 30 Days');
  const [copied, setCopied] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || []);
      if (data.reports && data.reports.length > 0 && !selectedReport) {
        setSelectedReport(data.reports[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    if (currentUser?.role === 'VIEWER') {
      alert('⚠️ Forbidden: Viewers cannot generate new reports (403)');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange: selectedTimeRange }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');

      setReports((prev) => [data.report, ...prev]);
      setSelectedReport(data.report);
      alert('🎉 Voice-of-Customer Report generated successfully!');
    } catch (err: any) {
      alert(`Report Generation Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (!selectedReport) return;
    const text = `
=== ${selectedReport.title} ===
Timeframe: ${selectedReport.timeRange} | Created: ${new Date(selectedReport.createdAt).toLocaleDateString()}
Total Feedback Analyzed: ${selectedReport.totalFeedbacks}
Net Sentiment Score: ${selectedReport.netSentimentScore}% (${selectedReport.positiveCount} Positive, ${selectedReport.neutralCount} Neutral, ${selectedReport.negativeCount} Negative)

EXECUTIVE SUMMARY:
${selectedReport.executiveSummary}

ACTION PLAN:
${selectedReport.actionPlan}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const parseJsonSafe = (raw: string): string[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [String(parsed)];
    } catch {
      return [raw];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Executive Voice-of-Customer (VoC) Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Synthesize leadership-ready intelligence briefs with sentiment trends, verbatim quotes, and action roadmaps.
          </p>
        </div>

        {/* Generate Trigger */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="All Time">All Time</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate VoC Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout: Reports List Drawer & Active Report Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Saved Reports History */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Generated Briefs ({reports.length})
          </div>

          {loading ? (
            <div className="text-xs text-slate-500 py-6 text-center">Loading briefs...</div>
          ) : reports.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No reports generated yet</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white line-clamp-1">{rep.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{rep.timeRange}</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Report Canvas */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 print:bg-white print:text-black print:border-none">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <span>{selectedReport.timeRange}</span>
                    <span>•</span>
                    <span>AI Synthesized</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {selectedReport.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Generated on {new Date(selectedReport.createdAt).toLocaleDateString()} by{' '}
                    <span className="text-slate-200 font-semibold">{selectedReport.createdBy}</span>
                  </p>
                </div>

                {/* Export & Copy Controls */}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* High Level Key Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Feedback</div>
                  <div className="text-xl font-black text-white mt-0.5">{selectedReport.totalFeedbacks}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Net Sentiment</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    +{selectedReport.netSentimentScore}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Positive vs Negative</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">
                    <span className="text-emerald-400">{selectedReport.positiveCount}</span> /{' '}
                    <span className="text-rose-400">{selectedReport.negativeCount}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Neutral / Inquiries</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">{selectedReport.neutralCount}</div>
                </div>
              </div>

              {/* 1. Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Executive Summary
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
                  {selectedReport.executiveSummary}
                </p>
              </div>

              {/* 2. Top Themes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Top Themes Identified
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parseJsonSafe(selectedReport.topThemes).map((theme, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 font-medium flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>{theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Strengths vs Critical Issues Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Key Strengths & Differentiators
                  </h3>
                  <div className="space-y-2">
                    {parseJsonSafe(selectedReport.keyStrengths).map((str, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed"
                      >
                        ✓ {str}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Issues */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    Critical Issues & Churn Risks
                  </h3>
                  <div className="space-y-2">
                    {parseJsonSafe(selectedReport.criticalIssues).map((iss, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-200 leading-relaxed"
                      >
                        ⚠️ {iss}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Action Plan */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4" />
                  Strategic Recommended Action Plan
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-mono">
                  {selectedReport.actionPlan}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="font-bold text-slate-300 text-sm">No report selected</div>
              <p className="text-xs text-slate-500 mt-1">
                Choose a brief from the left or generate a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
