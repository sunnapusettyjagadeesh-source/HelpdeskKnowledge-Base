export type ReviewStatus = 'verified' | 'needs_review' | 'under_review' | 'outdated';
export type UpdateUrgency = 'urgent' | 'warning' | 'healthy';
export type TargetAudience = 'agents_only' | 'public_and_agents' | 'developers';

export interface ResolutionStep {
  stepNumber: number;
  title: string;
  instructions: string;
  codeSnippet?: string;
  cautionNotice?: string;
}

export interface Article {
  _id?: string;
  id: string;
  title: string;
  slug: string;
  summary: string;
  categoryId: string;
  categoryName: string;
  content: string;
  resolutionSteps: ResolutionStep[];
  quickSnippet: string;
  keywords: string[];
  tags: string[];
  targetAudience: TargetAudience;
  author: string;
  reviewStatus: ReviewStatus;
  lastReviewedAt: string;
  lastReviewedBy?: string;
  verifiedUntil?: string;
  viewsCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulRatio: number;
  outdatedReportsCount: number;
  healthScore: number;
  updateUrgency: UpdateUrgency;
  urgencyReasons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
  articleCount?: number;
  needsReviewCount?: number;
}

export interface FeedbackItem {
  id: string;
  articleId: string;
  isHelpful: boolean;
  reason?: 'outdated_steps' | 'incorrect_info' | 'missing_details' | 'confusing' | 'worked_great' | 'other';
  userRole?: 'support_agent' | 'customer' | 'internal_engineer';
  comments?: string;
  suggestedCorrection?: string;
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  articleId: string;
  previousStatus: string;
  newStatus: string;
  reviewerName: string;
  notes: string;
  reviewedAt: string;
}

export interface MetricsSummary {
  totalArticles: number;
  verifiedCount: number;
  needsReviewCount: number;
  underReviewCount: number;
  outdatedCount: number;
  urgentCount: number;
  overallHelpfulRate: number;
  totalFeedbackCount: number;
  positiveFeedbackCount: number;
}

export interface MetricsResponse {
  summary: MetricsSummary;
  reasonBreakdown: Record<string, number>;
  urgentArticlesQueue: Article[];
}

export interface ArticleFormData {
  title: string;
  summary: string;
  categoryId: string;
  content: string;
  quickSnippet: string;
  targetAudience: TargetAudience;
  author: string;
  tagsString: string;
  keywordsString: string;
  resolutionSteps: ResolutionStep[];
}
