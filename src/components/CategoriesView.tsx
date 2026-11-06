import React, { useState } from 'react';
import { Category } from '../types/kb';
import { createCategory } from '../api/client';
import {
  ShieldCheck,
  Boxes,
  CreditCard,
  Terminal,
  MailCheck,
  FileLock2,
  Folder,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  onSelectCategory: (catId: string) => void;
  onRefreshCategories: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onSelectCategory,
  onRefreshCategories,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-cyan-600" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-amber-600" />;
      case 'MailCheck':
        return <MailCheck className="w-5 h-5 text-purple-600" />;
      case 'FileLock2':
        return <FileLock2 className="w-5 h-5 text-pink-600" />;
      default:
        return <Folder className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      setNewCatName('');
      setNewCatDesc('');
      setShowAddModal(false);
      onRefreshCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* View Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organized knowledge domains for rapid ticket resolution and topic audits.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {getCategoryIcon(cat.icon)}
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700 block tabular-nums">
                    {cat.articleCount ?? 0} {cat.articleCount === 1 ? 'article' : 'articles'}
                  </span>
                  {(cat.needsReviewCount ?? 0) > 0 && (
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 justify-end">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{cat.needsReviewCount} needs update</span>
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                {cat.description || 'Support answers and troubleshooting workflows.'}
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
              <span>Browse solutions</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
            {error && <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs">{error}</div>}
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Mobile Apps & Push Notifications"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="What topics does this category cover?"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
