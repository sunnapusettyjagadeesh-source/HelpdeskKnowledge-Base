import React, { useEffect, useState } from 'react';
import { MetricsResponse } from '../types/kb';
import { fetchMetrics, resetDatabaseSeed } from '../api/client';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  RotateCcw,
  Database,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface AnalyticsViewProps {
  onRefreshAll: () => void;
  dbType: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onRefreshAll, dbType }) => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleResetSeed = async () => {
    if (window.confirm('Reset the database to the initial rich support dataset? Any newly created articles will be refreshed.')) {
      try {
        setResetting(true);
        await resetDatabaseSeed();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        await loadMetrics();
        onRefreshAll();
      } catch (err: any) {
        alert(err.message || 'Failed to reset seed');
      } finally {
        setResetting(false);
      }
    }
  };

  if (loading || !metrics) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading knowledge base analytics...
      </div>
    );
  }

  const { summary, reasonBreakdown } = metrics;
  const verifiedPercent = Math.round((summary.verifiedCount / Math.max(1, summary.totalArticles)) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base Health & Feedback Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on article helpfulness, agent feedback triggers, and database persistence.
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          title="Reset sample data"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reload Seed Articles'}</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Database reset to initial verified support articles and agent feedback.</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Articles */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Articles</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {summary.totalArticles}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Across 6 dedicated support categories
          </div>
        </div>

        {/* Card 2: Helpfulness Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Helpfulness Rate</span>
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {summary.overallHelpfulRate}%
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono tabular-nums">
            {summary.positiveFeedbackCount} of {summary.totalFeedbackCount} ratings positive
          </div>
        </div>

        {/* Card 3: Verified Accuracy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Verified Current</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {verifiedPercent}%
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono tabular-nums">
            {summary.verifiedCount} verified / {summary.totalArticles} total
          </div>
        </div>

        {/* Card 4: Surfaced by Feedback (Differentiating Feature) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider text-amber-800">
              Needs Update
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono tabular-nums">
            {summary.urgentCount}
          </div>
          <div className="text-xs text-amber-800 mt-2">
            Surfaced by agent flags or low score
          </div>
        </div>
      </div>

      {/* Two Column Section: Feedback Reasons Breakdown & Persistence Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why Articles Get Flagged */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Agent Feedback Breakdown</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Specific issues reported by support agents answering customer tickets.
          </p>

          <div className="space-y-4 text-xs">
            {Object.entries({
              outdated_steps: 'Outdated UI steps or commands',
              incorrect_info: 'Incorrect command or code syntax',
              missing_details: 'Missing edge cases or incomplete',
              confusing: 'Confusing explanation',
              worked_great: 'Worked accurately & resolved ticket',
            }).map(([key, label]) => {
              const count = reasonBreakdown[key] || 0;
              const total = Math.max(1, summary.totalFeedbackCount);
              const pct = Math.round((count / total) * 100);

              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1 text-slate-700">
                    <span className="font-medium">{label}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        key === 'worked_great'
                          ? 'bg-emerald-500'
                          : key === 'outdated_steps'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Persistence Engine Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>MongoDB Persistence Architecture</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Dual-mode persistence engine with MongoDB driver and local atomic JSON document store.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                  Active Persistence Engine
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {dbType}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                  MongoDB Compatibility Guarantee
                </span>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Supports full MongoDB collection semantics: <code className="font-mono text-indigo-700">find()</code>, <code className="font-mono text-indigo-700">findOne()</code>, <code className="font-mono text-indigo-700">insertOne()</code>, <code className="font-mono text-indigo-700">updateOne()</code>, atomic disk persistence, and regex text search.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">
                  Connecting an External MongoDB Cluster
                </span>
                <p className="text-slate-600 text-xs mt-0.5">
                  Set <code className="font-mono text-slate-800 bg-slate-200 px-1 py-0.5 rounded">MONGODB_URI</code> in environment variables to seamlessly connect to MongoDB Atlas.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400 font-mono">
            System status: Operational · Port 3000
          </div>
        </div>
      </div>
    </div>
  );
};
