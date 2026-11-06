import React, { useState, useEffect, useMemo } from 'react';
import { Article, Category } from './types/kb';
import { fetchArticles, fetchCategories, fetchHealth } from './api/client';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal';
import { ArticleEditorModal } from './components/ArticleEditorModal';
import { ReviewQueueView } from './components/ReviewQueueView';
import { CategoriesView } from './components/CategoriesView';
import { AnalyticsView } from './components/AnalyticsView';
import {
  AlertTriangle,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Inbox,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'articles' | 'review_queue' | 'categories' | 'analytics'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState('all');
  const [needsUpdateOnly, setNeedsUpdateOnly] = useState(false);
  const [sortOption, setSortOption] = useState<'urgency' | 'views' | 'helpful_ratio' | 'updated'>('urgency');

  // Modals
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // DB Status
  const [dbType, setDbType] = useState('Initializing...');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [articlesData, categoriesData, healthData] = await Promise.all([
        fetchArticles({
          search: searchQuery,
          category: selectedCategory,
          reviewStatus: selectedReviewStatus,
          needsUpdate: needsUpdateOnly,
          sort: sortOption,
        }),
        fetchCategories(),
        fetchHealth().catch(() => ({ database: { status: 'File-Persisted MongoDB' } })),
      ]);

      setArticles(articlesData.articles);
      setCategories(categoriesData);
      setDbType(healthData.database?.status || 'MongoDB Engine');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to connect to Helpdesk Knowledge Base server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedReviewStatus, needsUpdateOnly, sortOption]);

  // Urgent articles for the differentiating review queue
  const urgentArticles = useMemo(() => {
    return articles.filter(
      (a) =>
        a.updateUrgency === 'urgent' ||
        a.updateUrgency === 'warning' ||
        a.reviewStatus === 'needs_review' ||
        a.reviewStatus === 'outdated'
    );
  }, [articles]);

  const handleSelectCategoryFromView = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('articles');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Strict Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateArticle={() => setIsCreatingArticle(true)}
        urgentCount={urgentArticles.length}
        dbType={dbType}
      />

      {/* Main View Router */}
      {activeTab === 'articles' && (
        <main className="flex-1 pb-16">
          {/* Hero & Search bar */}
          <HeroSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedReviewStatus={selectedReviewStatus}
            onSelectReviewStatus={setSelectedReviewStatus}
            categories={categories}
            totalArticles={articles.length}
            needsUpdateOnly={needsUpdateOnly}
            onToggleNeedsUpdateOnly={() => setNeedsUpdateOnly(!needsUpdateOnly)}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            {/* Differentiating Feature Callout Banner */}
            {urgentArticles.length > 0 && !needsUpdateOnly && (
              <div className="mb-6 bg-amber-50 border border-amber-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-amber-950">
                      Feedback Intelligence Alert: {urgentArticles.length} {urgentArticles.length === 1 ? 'article requires' : 'articles require'} review
                    </h2>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Support agents or customers reported outdated commands, incorrect UI steps, or low helpfulness scores.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('review_queue')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>Open Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Filter toolbar & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="font-semibold text-slate-900 tabular-nums">
                  {articles.length} {articles.length === 1 ? 'solution' : 'solutions'}
                </span>
                {searchQuery && (
                  <span>matching &quot;{searchQuery}&quot;</span>
                )}
                {selectedCategory !== 'all' && (
                  <span>in {categories.find((c) => c.id === selectedCategory)?.name}</span>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="urgency">Urgency / Health Score</option>
                  <option value="views">Most Viewed</option>
                  <option value="helpful_ratio">Highest Helpfulness %</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={loadData}
                  className="text-xs font-bold underline ml-4 hover:text-rose-950"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-56 bg-slate-100 rounded-xl border border-slate-200 animate-pulse p-6"
                  />
                ))}
              </div>
            ) : articles.length === 0 ? (
              /* Empty Search / Filter State */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No matching articles found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  We couldn&apos;t find any articles matching your search or active filter combination.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedReviewStatus('all');
                    setNeedsUpdateOnly(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              /* Populated Articles Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onOpen={(a) => setActiveArticleId(a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Differentiating Review Queue Tab */}
      {activeTab === 'review_queue' && (
        <main className="flex-1 pb-16">
          <ReviewQueueView
            urgentArticles={urgentArticles}
            onOpenArticle={(a) => setActiveArticleId(a.id)}
            onEditArticle={(a) => setEditingArticle(a)}
            onRefreshData={loadData}
          />
        </main>
      )}

      {/* Categories View Tab */}
      {activeTab === 'categories' && (
        <main className="flex-1 pb-16">
          <CategoriesView
            categories={categories}
            onSelectCategory={handleSelectCategoryFromView}
            onRefreshCategories={loadData}
          />
        </main>
      )}

      {/* Analytics & System Health Tab */}
      {activeTab === 'analytics' && (
        <main className="flex-1 pb-16">
          <AnalyticsView onRefreshAll={loadData} dbType={dbType} />
        </main>
      )}

      {/* Article Detail & Feedback Modal */}
      {activeArticleId && (
        <ArticleModal
          articleId={activeArticleId}
          onClose={() => setActiveArticleId(null)}
          onEditArticle={(art) => {
            setActiveArticleId(null);
            setEditingArticle(art);
          }}
          onArticleUpdated={loadData}
        />
      )}

      {/* Article Create / Edit Modal */}
      {(isCreatingArticle || editingArticle) && (
        <ArticleEditorModal
          initialArticle={editingArticle}
          categories={categories}
          onClose={() => {
            setIsCreatingArticle(false);
            setEditingArticle(null);
          }}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {/* Quiet, clean editorial footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">HelpdeskKnowledge Base</span>
            <span aria-hidden="true">·</span>
            <span>Support Team Article Library & Feedback Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono">
            <span>REST API v1</span>
            <span aria-hidden="true">·</span>
            <span>MongoDB Document Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
