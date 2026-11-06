import React from 'react';
import { Plus, Database, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'articles' | 'review_queue' | 'categories' | 'analytics';
  onSelectTab: (tab: 'articles' | 'review_queue' | 'categories' | 'analytics') => void;
  onOpenCreateArticle: () => void;
  urgentCount: number;
  dbType: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateArticle,
  urgentCount,
  dbType,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('articles')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
                Helpdesk<span className="text-indigo-600">Knowledge</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
                Support Article Library
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('articles')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'articles'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 py-4 -mb-[2px]'
                : ''
            }`}
          >
            Articles Library
          </button>

          <button
            onClick={() => onSelectTab('review_queue')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'review_queue'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 py-4 -mb-[2px]'
                : ''
            }`}
          >
            <span>Needs Review</span>
            {urgentCount > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 tabular-nums">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('categories')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'categories'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 py-4 -mb-[2px]'
                : ''
            }`}
          >
            Categories
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
              activeTab === 'analytics'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 py-4 -mb-[2px]'
                : ''
            }`}
          >
            Health & Analytics
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px]" title={`Persistence: ${dbType}`}>
              {dbType.includes('Live') ? 'MongoDB Connected' : 'Mongo Engine (JSON)'}
            </span>
          </div>

          <button
            onClick={onOpenCreateArticle}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-3 py-2 bg-slate-50 text-xs font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('articles')}
          className={`py-1 px-2 rounded ${activeTab === 'articles' ? 'text-indigo-600 font-bold bg-white' : ''}`}
        >
          Articles
        </button>
        <button
          onClick={() => onSelectTab('review_queue')}
          className={`py-1 px-2 rounded flex items-center gap-1 ${activeTab === 'review_queue' ? 'text-indigo-600 font-bold bg-white' : ''}`}
        >
          <span>Reviews</span>
          {urgentCount > 0 && <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded">{urgentCount}</span>}
        </button>
        <button
          onClick={() => onSelectTab('categories')}
          className={`py-1 px-2 rounded ${activeTab === 'categories' ? 'text-indigo-600 font-bold bg-white' : ''}`}
        >
          Categories
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`py-1 px-2 rounded ${activeTab === 'analytics' ? 'text-indigo-600 font-bold bg-white' : ''}`}
        >
          Analytics
        </button>
      </div>
    </header>
  );
};
