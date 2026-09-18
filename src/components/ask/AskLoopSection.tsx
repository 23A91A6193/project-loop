'use client';

import React, { useState } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Quote,
  ShieldCheck,
  Bot,
  User,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

interface QnAPair {
  question: string;
  answer: string;
  relatedQuotes: string[];
  feedbackCountQueried?: number;
  timestamp: string;
}

export const AskLoopSection: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<QnAPair[]>([
    {
      question: 'What are the most common complaints regarding mobile app stability?',
      answer:
        'Based on customer feedback records, users are experiencing a critical launch crash on Android 14 specifically with app version 2.4.1. In addition, iOS 17 users report camera upload freezing and push notification delivery delays averaging 45 minutes.',
      relatedQuotes: [
        '"App crashes immediately on launch after the v2.4.1 update on Android 14. Cannot even reach the login screen!" — Vikram Mehta (Google Play)',
        '"Constant freezing whenever attempting to upload camera images on iOS 17. Completely unusable for our field team." — Sarah Jenkins (App Store)',
        '"Push notifications are delayed by 45 minutes on the mobile app, making real-time delivery dispatches miss deadlines." — Carlos Mendez (Support Ticket)',
      ],
      feedbackCountQueried: 60,
      timestamp: 'Just now',
    },
  ]);

  const starterQuestions = [
    'What are the most requested enterprise features?',
    'Why are customers experiencing billing and invoice issues?',
    'What do customers love most about the UI redesign?',
    'Are there any performance bottlenecks during CSV data export?',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');

      setConversation((prev) => [
        {
          question: q.trim(),
          answer: data.answer,
          relatedQuotes: data.relatedQuotes || [],
          feedbackCountQueried: data.feedbackCountQueried,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setQuestion('');
    } catch (err: any) {
      alert(`AI Query Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-indigo-400" />
            Ask LOOP — Retrieval-Grounded Q&A (RAG)
          </h2>
          <p className="text-xs text-slate-400">
            Ask plain-English product questions. The AI engine searches your workspace database and grounds answers strictly in actual verbatim quotes.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-[11px] text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zero Hallucination Grounding</span>
        </div>
      </div>

      {/* Suggested Starters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1 mr-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Suggested:
        </span>
        {starterQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => {
              setQuestion(sq);
              handleAsk(sq);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition cursor-pointer"
          >
            "{sq}"
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-xl focus-within:border-indigo-500/60 transition">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about customer feedback (e.g., 'What are users saying about onboarding?')..."
            className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 shadow-lg shadow-indigo-600/30"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Q&A Thread Container */}
      <div className="space-y-4">
        {conversation.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4"
          >
            {/* User Question */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Executive Query</span>
                  <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  "{item.question}"
                </div>
              </div>
            </div>

            {/* AI Grounded Answer */}
            <div className="flex items-start gap-3 pt-2 border-t border-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300">LOOP Intelligence Engine</span>
                  {item.feedbackCountQueried && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                      Grounded across {item.feedbackCountQueried} customer records
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {item.answer}
                </div>

                {/* Evidence: Cited Customer Quotes */}
                {item.relatedQuotes && item.relatedQuotes.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <Quote className="w-3 h-3 text-indigo-400" />
                      <span>Verbatim Evidence & Customer Citations:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.relatedQuotes.map((quote, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 italic leading-snug flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{quote}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
