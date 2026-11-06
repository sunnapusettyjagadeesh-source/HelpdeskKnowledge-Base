import React, { useState } from 'react';
import { Article, Category, ResolutionStep, TargetAudience } from '../types/kb';
import { createArticle, updateArticle } from '../api/client';
import { X, Plus, Trash2, Code, AlertCircle, Check, FileText } from 'lucide-react';

interface ArticleEditorModalProps {
  initialArticle?: Article | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (article: Article) => void;
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  initialArticle,
  categories,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(initialArticle);

  const [title, setTitle] = useState(initialArticle?.title || '');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [categoryId, setCategoryId] = useState(initialArticle?.categoryId || categories[0]?.id || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [quickSnippet, setQuickSnippet] = useState(initialArticle?.quickSnippet || '');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(
    initialArticle?.targetAudience || 'public_and_agents'
  );
  const [author, setAuthor] = useState(initialArticle?.author || 'Support Knowledge Team');
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags.join(', ') || 'support, troubleshooting');
  const [keywordsInput, setKeywordsInput] = useState(
    initialArticle?.keywords.join(', ') || 'troubleshooting, error, guide'
  );

  const [resolutionSteps, setResolutionSteps] = useState<ResolutionStep[]>(
    initialArticle?.resolutionSteps && initialArticle.resolutionSteps.length > 0
      ? initialArticle.resolutionSteps
      : [
          {
            stepNumber: 1,
            title: 'Identify the error code or symptom',
            instructions: 'Verify the log entries or customer screenshot against known error signatures.',
          },
        ]
  );

  // Edit review options
  const [markAsReviewed, setMarkAsReviewed] = useState(false);
  const [reviewerName, setReviewerName] = useState('Knowledge Lead');
  const [reviewNotes, setReviewNotes] = useState('Updated steps and tested against latest system version.');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddStep = () => {
    setResolutionSteps([
      ...resolutionSteps,
      {
        stepNumber: resolutionSteps.length + 1,
        title: `Step ${resolutionSteps.length + 1}: `,
        instructions: '',
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = resolutionSteps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setResolutionSteps(updated);
  };

  const handleStepChange = (index: number, field: keyof ResolutionStep, value: any) => {
    const updated = [...resolutionSteps];
    updated[index] = { ...updated[index], [field]: value };
    setResolutionSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic client-side validation
    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters long.');
      return;
    }
    if (!summary.trim() || summary.trim().length < 10) {
      setErrorMsg('Summary must be at least 10 characters long.');
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      setErrorMsg('Problem context / content must be at least 20 characters.');
    }
    if (!quickSnippet.trim() || quickSnippet.trim().length < 10) {
      setErrorMsg('Quick ticket response snippet is required.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Please select a category.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    try {
      setSaving(true);
      let savedArticle: Article;

      const payload = {
        title,
        summary,
        categoryId,
        content,
        quickSnippet,
        resolutionSteps,
        targetAudience,
        author,
        tags,
        keywords,
        markAsReviewed,
        reviewerName,
        reviewNotes,
      };

      if (isEditing && initialArticle) {
        savedArticle = await updateArticle(initialArticle.id, payload);
      } else {
        savedArticle = await createArticle(payload);
      }

      onSaved(savedArticle);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {isEditing ? 'Edit Knowledge Base Article' : 'Create New Support Article'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Resolving SAML 2.0 Single Sign-On 'Invalid Signature' Errors"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Short Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1-2 sentences summarizing symptoms and direct fix"
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Ticket Response Snippet */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
            <label className="block text-indigo-950 font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Ready-to-Paste Support Response Snippet <span className="text-rose-500">*</span></span>
            </label>
            <p className="text-xs text-indigo-800">
              This response template is copied by support agents with one click directly into customer tickets.
            </p>
            <textarea
              rows={4}
              required
              value={quickSnippet}
              onChange={(e) => setQuickSnippet(e.target.value)}
              placeholder="Hi {{ticket.requester.first_name}},&#10;&#10;Here are the exact steps to fix..."
              className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-slate-900 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Diagnostic Context */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Problem Context & Diagnostics <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain the underlying cause, logs to look for, and architecture notes..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Step-by-Step Procedures Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-slate-900 font-bold">
                  Step-by-Step Resolution Procedures
                </label>
                <p className="text-xs text-slate-500">
                  Break down instructions into clear actionable steps for agents and customers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-4">
              {resolutionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-indigo-700 text-xs">
                      Step {step.stepNumber}
                    </span>
                    {resolutionSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove Step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Step Title (e.g. Export Certificate from Okta)"
                      value={step.title}
                      onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Detailed instructions for this step..."
                      value={step.instructions}
                      onChange={(e) => handleStepChange(idx, 'instructions', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Optional command / code snippet"
                        value={step.codeSnippet || ''}
                        onChange={(e) => handleStepChange(idx, 'codeSnippet', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Optional caution / warning notice"
                        value={step.cautionNotice || ''}
                        onChange={(e) => handleStepChange(idx, 'cautionNotice', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata: Audience, Author, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              >
                <option value="public_and_agents">Public & Support Agents</option>
                <option value="agents_only">Support Agents Only (Internal)</option>
                <option value="developers">Developers & Integrators</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Author / Owner</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="sso, saml, okta"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* When editing: Option to reset outdated flags and verify */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markAsReviewed}
                  onChange={(e) => setMarkAsReviewed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-emerald-950 text-xs">
                  Mark as Verified & Clear Outdated Flags
                </span>
              </label>
              <p className="text-[11px] text-emerald-800 ml-6">
                Check this if you have tested and verified that these steps are now accurate. This will reset the outdated report counter and update the health score.
              </p>

              {markAsReviewed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 ml-6">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Reviewer Name"
                    className="p-1.5 bg-white border border-emerald-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Audit note"
                    className="p-1.5 bg-white border border-emerald-300 rounded text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              {saving ? 'Saving Article...' : isEditing ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
