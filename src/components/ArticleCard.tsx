import React, { useState } from 'react';
import { Article } from '../types/kb';
import { Copy, Check, Eye, AlertTriangle, ShieldCheck, Clock, ArrowRight, User } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
  onOpenReviewModal?: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onOpen, onOpenReviewModal }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.quickSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(article.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const helpfulPercent = Math.round(article.helpfulRatio * 100);
  const totalFeedback = article.helpfulCount + article.notHelpfulCount;

  const isUrgent = article.updateUrgency === 'urgent' || article.reviewStatus === 'outdated';
  const isWarning = article.updateUrgency === 'warning' || article.reviewStatus === 'needs_review';

  return (
    <div
      onClick={() => onOpen(article)}
      className={`group relative bg-white rounded-xl border p-5 sm:p-6 transition-all hover:border-slate-300 hover:shadow-sm cursor-pointer flex flex-col justify-between ${
        isUrgent
          ? 'border-amber-300/80 bg-amber-50/20'
          : isWarning
          ? 'border-amber-200/60'
          : 'border-slate-200'
      }`}
    >
      <div>
        {/* Top Unboxed Metadata & Status Indicator */}
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-indigo-700 tracking-wide uppercase text-[11px]">
              {article.categoryName}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="tabular-nums font-mono">{formattedDate}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="tabular-nums font-mono flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" />
              {article.viewsCount}
            </span>
          </div>

          {/* Review Status Display */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-medium">
            {article.reviewStatus === 'verified' && (
              <span className="text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
            {article.reviewStatus === 'needs_review' && (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Needs Review</span>
              </span>
            )}
            {article.reviewStatus === 'under_review' && (
              <span className="text-sky-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Under Review</span>
              </span>
            )}
            {article.reviewStatus === 'outdated' && (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Outdated</span>
              </span>
            )}
          </div>
        </div>

        {/* Article Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
          {article.title}
        </h3>

        {/* Article Summary */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {article.summary}
        </p>

        {/* Differentiating Feature: Feedback intelligence alert callout if flagged */}
        {(isUrgent || isWarning) && article.urgencyReasons.length > 0 && (
          <div className="mb-4 text-xs rounded-lg p-2.5 bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Surfaced for update:</span>
              <span className="text-amber-800 line-clamp-1">{article.urgencyReasons[0]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Health & Fast Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-2">
        {/* Helpfulness stats */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span
            className={`font-semibold tabular-nums ${
              helpfulPercent >= 80 ? 'text-emerald-700' : helpfulPercent >= 60 ? 'text-slate-700' : 'text-amber-700'
            }`}
          >
            {helpfulPercent}% helpful
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="tabular-nums text-slate-400">
            {totalFeedback} {totalFeedback === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySnippet}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              copied
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Copy pre-written customer reply for tickets"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Solution'}</span>
          </button>

          <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Read</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
