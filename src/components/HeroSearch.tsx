import React, { useEffect, useRef } from 'react';
import { Search, X, Command, Filter, SlidersHorizontal } from 'lucide-react';
import { Category, ReviewStatus } from '../types/kb';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  selectedReviewStatus: string;
  onSelectReviewStatus: (status: string) => void;
  categories: Category[];
  totalArticles: number;
  needsUpdateOnly: boolean;
  onToggleNeedsUpdateOnly: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedReviewStatus,
  onSelectReviewStatus,
  categories,
  totalArticles,
  needsUpdateOnly,
  onToggleNeedsUpdateOnly,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const popularQueries = [
    'SAML signature failure',
    'Webhook 504 timeout',
    'Stripe pro-rated refund',
    '429 rate limit',
    '2FA admin reset',
    'SPF DMARC spam',
  ];

  return (
    <div className="bg-slate-900 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
      {/* Subtle geometric pattern backdrop */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance">
          Support Solutions & Verified Knowledge Base
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Stop repeating answers across chat and tickets. Find ready-to-paste customer solutions, verify steps, and surface outdated documentation with real-time feedback.
        </p>

        {/* Big Search Input */}
        <div className="relative max-w-3xl mx-auto text-left shadow-xl shadow-slate-950/40 rounded-xl bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
          <div className="flex items-center px-4 py-3.5 gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by symptom, error code, customer question, or keywords..."
              className="w-full text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Popular queries quick clicks */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Quick Searches:</span>
          {popularQueries.map((q) => (
            <button
              key={q}
              onClick={() => onSearchChange(q)}
              className="text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-4 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Filter bar controls */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
            >
              <option value="all">All Categories ({totalArticles})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.articleCount !== undefined ? `(${c.articleCount})` : ''}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-slate-400 font-medium ml-2">
              <span>Status:</span>
            </div>
            <select
              value={selectedReviewStatus}
              onChange={(e) => onSelectReviewStatus(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
            >
              <option value="all">All Review Statuses</option>
              <option value="verified">Verified & Current</option>
              <option value="needs_review">Needs Review</option>
              <option value="under_review">Under Active Review</option>
              <option value="outdated">Marked Outdated</option>
            </select>
          </div>

          {/* Differentiating Feature quick toggle */}
          <div>
            <button
              onClick={onToggleNeedsUpdateOnly}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                needsUpdateOnly
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Surfaced by Feedback (Needs Update)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
