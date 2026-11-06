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

export interface ResolutionStep {
  stepNumber: number;
  title: string;
  instructions: string;
  codeSnippet?: string;
  cautionNotice?: string;
}

export type ReviewStatus = 'verified' | 'needs_review' | 'under_review' | 'outdated';
export type UpdateUrgency = 'urgent' | 'warning' | 'healthy';

export interface Article {
  _id?: string;
  id: string;
  title: string;
  slug: string;
  summary: string;
  categoryId: string;
  categoryName: string;
  content: string; // Markdown or rich text
  resolutionSteps: ResolutionStep[];
  quickSnippet: string; // Fast copy for support tickets
  keywords: string[];
  tags: string[];
  targetAudience: 'agents_only' | 'public_and_agents' | 'developers';
  author: string;
  reviewStatus: ReviewStatus;
  lastReviewedAt: string;
  lastReviewedBy?: string;
  verifiedUntil?: string;
  viewsCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulRatio: number; // 0 to 1
  outdatedReportsCount: number;
  healthScore: number; // 0 to 100
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
}

// Calculate health score and update urgency based on feedback & freshness
export function calculateArticleHealth(
  helpfulCount: number,
  notHelpfulCount: number,
  outdatedReportsCount: number,
  lastReviewedAt: string,
  currentStatus: ReviewStatus
): {
  helpfulRatio: number;
  healthScore: number;
  updateUrgency: UpdateUrgency;
  urgencyReasons: string[];
  suggestedStatus: ReviewStatus;
} {
  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulRatio = totalFeedback === 0 ? 1 : Number((helpfulCount / totalFeedback).toFixed(2));

  const reasons: string[] = [];
  let score = 100;

  // Feedback penalty
  if (totalFeedback >= 3) {
    if (helpfulRatio < 0.6) {
      score -= 40;
      reasons.push(`Low helpfulness rating (${Math.round(helpfulRatio * 100)}%) based on ${totalFeedback} reviews`);
    } else if (helpfulRatio < 0.8) {
      score -= 20;
      reasons.push(`Sub-optimal helpfulness (${Math.round(helpfulRatio * 100)}%)`);
    }
  }

  // Outdated reports penalty
  if (outdatedReportsCount >= 2) {
    score -= 35;
    reasons.push(`${outdatedReportsCount} support agents flagged outdated UI steps or commands`);
  } else if (outdatedReportsCount === 1) {
    score -= 15;
    reasons.push(`1 agent flagged outdated content`);
  }

  // Age / Staleness calculation
  const lastReviewedDate = new Date(lastReviewedAt);
  const now = new Date();
  const daysSinceReview = Math.floor((now.getTime() - lastReviewedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceReview > 120) {
    score -= 25;
    reasons.push(`Not reviewed for ${daysSinceReview} days (policy threshold: 90 days)`);
  } else if (daysSinceReview > 90) {
    score -= 15;
    reasons.push(`Review due soon (${daysSinceReview} days since last audit)`);
  }

  if (currentStatus === 'outdated') {
    score = Math.min(score, 30);
    reasons.push('Explicitly marked as Outdated');
  } else if (currentStatus === 'needs_review') {
    score = Math.min(score, 50);
  }

  score = Math.max(0, Math.min(100, score));

  let updateUrgency: UpdateUrgency = 'healthy';
  let suggestedStatus = currentStatus;

  if (score < 55 || outdatedReportsCount >= 2 || (helpfulRatio < 0.6 && totalFeedback >= 3) || currentStatus === 'outdated') {
    updateUrgency = 'urgent';
    if (currentStatus === 'verified') {
      suggestedStatus = 'needs_review';
    }
  } else if (score < 80 || daysSinceReview > 90 || currentStatus === 'needs_review') {
    updateUrgency = 'warning';
    if (currentStatus === 'verified') {
      suggestedStatus = 'needs_review';
    }
  }

  return {
    helpfulRatio,
    healthScore: score,
    updateUrgency,
    urgencyReasons: reasons,
    suggestedStatus,
  };
}
