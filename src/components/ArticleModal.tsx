import React, { useState, useEffect } from 'react';
import { Article, FeedbackItem, ReviewLog, ReviewStatus } from '../types/kb';
import { fetchArticleById, submitArticleFeedback, submitArticleReview, deleteArticle } from '../api/client';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Code,
  FileText,
  User,
  History,
} from 'lucide-react';

interface ArticleModalProps {
  articleId: string;
  onClose: () => void;
  onEditArticle: (article: Article) => void;
  onArticleUpdated: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  articleId,
  onClose,
  onEditArticle,
  onArticleUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewLog[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Feedback form state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string>('outdated_steps');
  const [feedbackRole, setFeedbackRole] = useState<'support_agent' | 'customer' | 'internal_engineer'>('support_agent');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackCorrection, setFeedbackCorrection] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Status review transition modal state
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewStatusChoice, setReviewStatusChoice] = useState<ReviewStatus>('verified');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchArticleById(articleId);
      setArticle(res.article);
      setFeedbackList(res.feedback);
      setReviewsList(res.reviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [articleId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyQuickSnippet = () => {
    if (!article) return;
    navigator.clipboard.writeText(article.quickSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyCode = (code: string, stepNum: number) => {
    navigator.clipboard.writeText(code);
    setCopiedStep(stepNum);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleSendFeedback = async (isHelpful: boolean) => {
    if (!article) return;
    if (isHelpful) {
      // Direct positive submission
      try {
        setSubmittingFeedback(true);
        await submitArticleFeedback(article.id, {
          isHelpful: true,
          reason: 'worked_great',
          userRole: feedbackRole,
          comments: 'Worked accurately as described.',
        });
        setFeedbackSubmitted(true);
        onArticleUpdated();
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to submit feedback');
      } finally {
        setSubmittingFeedback(false);
      }
    } else {
      // Open detailed negative feedback questions
      setFeedbackHelpful(false);
    }
  };

  const handleDetailedFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;
    try {
      setSubmittingFeedback(true);
      await submitArticleFeedback(article.id, {
        isHelpful: false,
        reason: feedbackReason,
        userRole: feedbackRole,
        comments: feedbackComments,
        suggestedCorrection: feedbackCorrection,
      });
      setFeedbackSubmitted(true);
      onArticleUpdated();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;
    try {
      setSubmittingReview(true);
      await submitArticleReview(article.id, {
        status: reviewStatusChoice,
        reviewerName: reviewerName.trim() || 'Support Lead',
        notes: reviewNotes.trim() || 'Reviewed article accuracy and freshness.',
      });
      setIsReviewing(false);
      onArticleUpdated();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (window.confirm(`Are you sure you want to delete "${article.title}"? This cannot be undone.`)) {
      try {
        await deleteArticle(article.id);
        onArticleUpdated();
        onClose();
      } catch (err: any) {
        alert(err.message || 'Failed to delete article');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-indigo-700 uppercase tracking-wide">
              {article?.categoryName || 'Support Article'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Target: {article?.targetAudience.replace('_', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">
              Last Verified: {article ? new Date(article.lastReviewedAt).toLocaleDateString() : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {article && (
              <button
                onClick={() => onEditArticle(article)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Edit Article"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {loading && (
            <div className="py-16 text-center text-slate-500 font-medium">
              Loading article details...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          {article && (
            <>
              {/* Title & Review Status Alert */}
              <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {article.reviewStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified & Current</span>
                    </span>
                  )}
                  {article.reviewStatus === 'needs_review' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Needs Review (Flagged by Agent Feedback)</span>
                    </span>
                  )}
                  {article.reviewStatus === 'under_review' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>Under Active Review</span>
                    </span>
                  )}
                  {article.reviewStatus === 'outdated' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Marked Outdated — Requires Update</span>
                    </span>
                  )}

                  <button
                    onClick={() => setIsReviewing(!isReviewing)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 ml-auto"
                  >
                    Change Review Status
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {article.title}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {article.summary}
                </p>

                {/* Urgency Alert Box */}
                {article.urgencyReasons.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
                    <div className="font-bold flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Feedback Intelligence Trigger</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                      {article.urgencyReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Status transition panel (toggleable) */}
              {isReviewing && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs"
                >
                  <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                    <span>Audit Review Workflow</span>
                    <button
                      type="button"
                      onClick={() => setIsReviewing(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Target Status</label>
                      <select
                        value={reviewStatusChoice}
                        onChange={(e) => setReviewStatusChoice(e.target.value as ReviewStatus)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                      >
                        <option value="verified">Verified (Accurate & Fresh)</option>
                        <option value="under_review">Under Active Review</option>
                        <option value="needs_review">Needs Review (Flag for updates)</option>
                        <option value="outdated">Outdated (Deprecated steps)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Reviewer Name</label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="e.g. Elena Rostova (Lead)"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Audit Notes / Changelog</label>
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Verified steps against v4.1 API release; tested cURL command."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    {submittingReview ? 'Updating Audit Log...' : 'Save Review Status'}
                  </button>
                </form>
              )}

              {/* Ready-to-Paste Customer Response Box (Support Team Superpower) */}
              <div className="bg-indigo-50/60 rounded-xl border border-indigo-100 p-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Ready-to-Paste Customer Response (Ticket Template)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyQuickSnippet}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      copiedSnippet
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy for Ticket'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs sm:text-sm text-slate-800 whitespace-pre-line font-mono leading-relaxed">
                  {article.quickSnippet}
                </div>
              </div>

              {/* Problem Explanation Content */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Problem Context & Diagnostic Overview
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {article.content}
                </div>
              </div>

              {/* Resolution Steps List */}
              {article.resolutionSteps && article.resolutionSteps.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Step-by-Step Resolution Procedures
                  </h2>
                  <div className="space-y-4">
                    {article.resolutionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {step.stepNumber}
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {step.instructions}
                            </p>

                            {step.cautionNotice && (
                              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{step.cautionNotice}</span>
                              </div>
                            )}

                            {step.codeSnippet && (
                              <div className="relative mt-2">
                                <div className="absolute right-2 top-2">
                                  <button
                                    onClick={() => handleCopyCode(step.codeSnippet!, step.stepNumber)}
                                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                                    title="Copy code"
                                  >
                                    {copiedStep === step.stepNumber ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                                  <code>{step.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Differentiating Feature: Agent Feedback & Quality Rating Widget */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Did this article solve your support case?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your feedback directly surfaces articles needing updates, keeping answers accurate for the whole team.
                    </p>
                  </div>

                  {!feedbackSubmitted && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSendFeedback(true)}
                        disabled={submittingFeedback}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Yes, Solved It</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendFeedback(false)}
                        disabled={submittingFeedback}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>No, Needs Update</span>
                      </button>
                    </div>
                  )}
                </div>

                {feedbackSubmitted && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Thank you! Your feedback was recorded and factored into the Article Health Score.
                    </span>
                  </div>
                )}

                {/* Expanded negative feedback form */}
                {!feedbackSubmitted && feedbackHelpful === false && (
                  <form
                    onSubmit={handleDetailedFeedbackSubmit}
                    className="pt-4 border-t border-slate-800 space-y-3 text-xs"
                  >
                    <div className="font-semibold text-amber-300">
                      Help us improve this article — what was the issue?
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Issue Category</label>
                        <select
                          value={feedbackReason}
                          onChange={(e) => setFeedbackReason(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          <option value="outdated_steps">Outdated Steps / UI Changed</option>
                          <option value="incorrect_info">Incorrect Command or Code</option>
                          <option value="missing_details">Missing Edge Case / Incomplete</option>
                          <option value="confusing">Confusing Explanation</option>
                          <option value="other">Other Issue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Your Role</label>
                        <select
                          value={feedbackRole}
                          onChange={(e) => setFeedbackRole(e.target.value as any)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          <option value="support_agent">Support Agent (Answering Ticket)</option>
                          <option value="internal_engineer">Software / Product Engineer</option>
                          <option value="customer">End User / Customer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">What was broken or outdated?</label>
                      <textarea
                        rows={2}
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="e.g. In the new UI release, the button moved to Settings > Integrations..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setFeedbackHelpful(null)}
                        className="px-3 py-1.5 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
                      >
                        {submittingFeedback ? 'Submitting...' : 'Flag Article for Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Review & Audit Log History */}
              {reviewsList.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Review Audit History</span>
                  </h3>
                  <div className="space-y-2">
                    {reviewsList.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {rev.reviewerName} changed status to{' '}
                            <span className="text-indigo-600 font-bold">{rev.newStatus}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{rev.notes}</p>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(rev.reviewedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Delete Danger Zone */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>Article ID: {article.id}</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Article</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
