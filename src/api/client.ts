import { Article, Category, FeedbackItem, MetricsResponse, ReviewLog, ReviewStatus } from '../types/kb';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  const data = await res.json();
  return data.categories || [];
}

export async function createCategory(cat: { name: string; description?: string; color?: string }) {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create category');
  }
  return res.json();
}

export async function fetchArticles(params: {
  search?: string;
  category?: string;
  reviewStatus?: string;
  needsUpdate?: boolean;
  audience?: string;
  sort?: string;
}): Promise<{ articles: Article[]; count: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.reviewStatus && params.reviewStatus !== 'all') query.set('reviewStatus', params.reviewStatus);
  if (params.needsUpdate) query.set('needsUpdate', 'true');
  if (params.audience && params.audience !== 'all') query.set('audience', params.audience);
  if (params.sort) query.set('sort', params.sort);

  const res = await fetch(`${API_BASE}/articles?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch articles');
  }
  return res.json();
}

export async function fetchArticleById(id: string): Promise<{
  article: Article;
  feedback: FeedbackItem[];
  reviews: ReviewLog[];
  related: Article[];
}> {
  const res = await fetch(`${API_BASE}/articles/${id}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch article details');
  }
  return res.json();
}

export async function createArticle(payload: any): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.details ? err.details.join('. ') : err.error || 'Failed to create article');
  }
  const data = await res.json();
  return data.article;
}

export async function updateArticle(id: string, payload: any): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.details ? err.details.join('. ') : err.error || 'Failed to update article');
  }
  const data = await res.json();
  return data.article;
}

export async function deleteArticle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete article');
  }
}

export async function submitArticleFeedback(
  articleId: string,
  payload: {
    isHelpful: boolean;
    reason?: string;
    userRole?: string;
    comments?: string;
    suggestedCorrection?: string;
  }
): Promise<{ feedback: FeedbackItem; article: Article }> {
  const res = await fetch(`${API_BASE}/articles/${articleId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to record feedback');
  }
  return res.json();
}

export async function submitArticleReview(
  articleId: string,
  payload: {
    status: ReviewStatus;
    reviewerName: string;
    notes?: string;
  }
): Promise<{ article: Article; reviewLog: ReviewLog }> {
  const res = await fetch(`${API_BASE}/articles/${articleId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit review');
  }
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function resetDatabaseSeed(): Promise<void> {
  const res = await fetch(`${API_BASE}/seed/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset seed');
}
