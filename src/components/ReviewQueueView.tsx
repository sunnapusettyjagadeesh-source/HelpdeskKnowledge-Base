import React, { useState } from 'react';
import { Article } from '../types/kb';
import { submitArticleReview } from '../api/client';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Edit3,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ReviewQueueViewProps {
  urgentArticles: Article[];
  onOpenArticle: (article: Article) => void;
  onEditArticle: (article: Article) => void;
  onRefreshData: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  urgentArticles,
  onOpenArticle,
  onEditArticle,
  onRefreshData,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'warning'>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifierName, setVerifierName] = useState('Support Lead');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredArticles = urgentArticles.filter((a) => {
    if (selectedFilter === 'urgent') return a.updateUrgency === 'urgent' || a.reviewStatus === 'outdated';
    if (selectedFilter === 'warning') return a.updateUrgency === 'warning' || a.reviewStatus === 'needs_review';
    return true;
  });

  const handleQuickVerify = async (articleId: string) => {
    try {
      setSubmitting(true);
      await submitArticleReview(articleId, {
        status: 'verified',
        reviewerName: verifierName || 'Support Lead',
        notes: reviewNote || 'Verified solution accuracy and cleared outdated flags.',
      });
      setVerifyingId(null);
      setReviewNote('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to verify article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetUnderReview = async (articleId: string) => {
    try {
      setSubmitting(true);
      await submitArticleReview(articleId, {
        status: 'under_review',
        reviewerName: verifierName || 'Support Lead',
        notes: 'Assigned to support engineering for review.',
      });
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner explaining the Differentiating Feature */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent p-6 rounded-2xl border border-amber-200/80">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Differentiating Feature
              </span>
              <span className="text-xs text-slate-500 font-mono">Feedback Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Articles Surfaced for Review
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl mt-1 leading-relaxed">
              When support agents or customers report that steps failed, commands threw errors, or helpfulness drops, this system automatically flags the article and pulls it into this active review queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex items-center gap-2 pt-4 border-t border-amber-200/60 text-xs">
          <span className="font-semibold text-slate-700">Filter Queue:</span>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Surfaced ({urgentArticles.length})
          </button>
          <button
            onClick={() => setSelectedFilter('urgent')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFilter === 'urgent'
                ? 'bg-rose-700 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Critical / Urgent
          </button>
          <button
            onClick={() => setSelectedFilter('warning')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            Needs Periodic Audit
          </button>
        </div>
      </div>

      {/* Queue Listing */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Knowledge Base is Healthy</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            No articles currently have critical negative feedback or pending update flags. All solutions are verified current!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const helpfulPercent = Math.round(article.helpfulRatio * 100);
            const totalFeedback = article.helpfulCount + article.notHelpfulCount;

            return (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                {/* Left Side: Article info & reasons */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-indigo-700 uppercase tracking-wide">
                      {article.categoryName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-mono">
                      Health Score: {article.healthScore}/100
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-mono">
                      {article.helpfulCount} helpful / {article.notHelpfulCount} negative
                    </span>
                  </div>

                  <h3
                    onClick={() => onOpenArticle(article)}
                    className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                  >
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {article.summary}
                  </p>

                  {/* Why this article was surfaced */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Surfaced Triggers:</span>
                    </div>
                    {article.urgencyReasons.map((reason, i) => (
                      <div key={i} className="text-amber-800 ml-5 list-item">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Quick Action Panel */}
                <div className="md:w-64 shrink-0 flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 text-xs">
                  <button
                    onClick={() => onOpenArticle(article)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors"
                  >
                    <span>View & Test Solution</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onEditArticle(article)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit & Fix Steps</span>
                  </button>

                  {article.reviewStatus !== 'under_review' && (
                    <button
                      onClick={() => handleSetUnderReview(article.id)}
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-lg transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mark Under Review</span>
                    </button>
                  )}

                  {/* Quick verification form */}
                  {verifyingId === article.id ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 mt-1">
                      <div className="font-bold text-slate-800">Confirm Verification</div>
                      <input
                        type="text"
                        value={verifierName}
                        onChange={(e) => setVerifierName(e.target.value)}
                        placeholder="Your Name / Team"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Audit notes (e.g. Tested on v4)"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVerifyingId(null)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickVerify(article.id)}
                          disabled={submitting}
                          className="flex-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                        >
                          {submitting ? 'Saving...' : 'Verify Now'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setVerifyingId(article.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Mark as Verified</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
