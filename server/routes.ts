import express, { Request, Response, NextFunction } from 'express';
import { initDatabase } from './db';
import { Article, calculateArticleHealth, Category, FeedbackItem, ResolutionStep, ReviewLog, ReviewStatus } from './models';

export const apiRouter = express.Router();

// Helper: generate url slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Health check & DB status
apiRouter.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDatabase();
    const count = await db.articles.countDocuments();
    res.json({
      status: 'healthy',
      database: {
        type: db.type,
        status: db.status,
      },
      stats: {
        articlesCount: count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// 2. Categories
apiRouter.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDatabase();
    const categories = await db.categories.find();
    const articles = await db.articles.find();

    // Attach article counts and needsReview counts to each category
    const enriched = categories.map((cat) => {
      const catArticles = articles.filter((a) => a.categoryId === cat.id);
      const needsReviewCount = catArticles.filter(
        (a) => a.updateUrgency === 'urgent' || a.reviewStatus === 'needs_review' || a.reviewStatus === 'outdated'
      ).length;
      return {
        ...cat,
        articleCount: catArticles.length,
        needsReviewCount,
      };
    });

    res.json({ categories: enriched });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Category name is required and must be at least 2 characters.' });
    }

    const db = await initDatabase();
    const existing = await db.categories.find();
    const slug = slugify(name);

    if (existing.some((c) => c.slug === slug)) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      slug,
      description: description ? String(description).trim() : '',
      icon: icon || 'Folder',
      color: color || '#4f46e5',
      displayOrder: existing.length + 1,
    };

    await db.categories.insertOne(newCategory);
    res.status(201).json({ category: newCategory });
  } catch (err) {
    next(err);
  }
});

// 3. Articles List with Search, Filter & Urgency Sorting
apiRouter.get('/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDatabase();
    const { search, category, reviewStatus, needsUpdate, audience, sort } = req.query;

    const filter: any = {};
    if (category && category !== 'all') {
      filter.categoryId = String(category);
    }
    if (reviewStatus && reviewStatus !== 'all') {
      filter.reviewStatus = String(reviewStatus);
    }
    if (needsUpdate === 'true') {
      filter.needsUpdate = true;
    }
    if (audience && audience !== 'all') {
      filter.targetAudience = String(audience);
    }
    if (search && String(search).trim()) {
      filter.$text = { $search: String(search).trim() };
    }

    const sortOptions: any = {};
    if (sort === 'urgency') {
      // Lower healthScore = higher urgency
      sortOptions.healthScore = 1;
    } else if (sort === 'views') {
      sortOptions.viewsCount = -1;
    } else if (sort === 'helpful_ratio') {
      sortOptions.helpfulRatio = -1;
    } else if (sort === 'updated') {
      sortOptions.updatedAt = -1;
    } else {
      // Default: urgent articles first, then updated date
      sortOptions.healthScore = 1;
    }

    const articles = await db.articles.find(filter, sortOptions);
    res.json({
      articles,
      count: articles.length,
      filterApplied: {
        category: category || 'all',
        reviewStatus: reviewStatus || 'all',
        needsUpdate: needsUpdate === 'true',
        search: search || '',
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Single Article Details + Feedback history
apiRouter.get('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const db = await initDatabase();
    const article = await db.articles.findOne({ id });

    if (!article) {
      return res.status(404).json({ error: 'Knowledge base article not found.' });
    }

    // Increment views count asynchronously
    db.articles.updateOne({ id }, { $inc: { viewsCount: 1 } }).catch(() => {});

    // Fetch related feedback and review audit log
    const feedback = await db.feedback.find({ articleId: id });
    const reviews = await db.reviews.find({ articleId: id });

    // Fetch related articles from same category
    const related = (await db.articles.find({ categoryId: article.categoryId }))
      .filter((a) => a.id !== id)
      .slice(0, 3);

    res.json({
      article: {
        ...article,
        viewsCount: article.viewsCount + 1,
      },
      feedback,
      reviews,
      related,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Create Article with rigorous input validation
apiRouter.post('/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      summary,
      categoryId,
      content,
      resolutionSteps,
      quickSnippet,
      keywords,
      tags,
      targetAudience,
      author,
    } = req.body;

    // Validation
    const errors: string[] = [];
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      errors.push('Article title must be at least 5 characters long.');
    }
    if (!summary || typeof summary !== 'string' || summary.trim().length < 10) {
      errors.push('Summary is required and must be at least 10 characters.');
    }
    if (!categoryId) {
      errors.push('Please select a valid category.');
    }
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      errors.push('Article problem explanation content must be at least 20 characters.');
    }
    if (!quickSnippet || typeof quickSnippet !== 'string' || quickSnippet.trim().length < 10) {
      errors.push('Quick snippet (fast answer for tickets) is required for support speed.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const db = await initDatabase();
    const categories = await db.categories.find();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Selected category does not exist.' });
    }

    const now = new Date().toISOString();
    const id = `art-${Date.now()}`;
    const slug = `${slugify(title)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Parse resolution steps
    const steps: ResolutionStep[] = Array.isArray(resolutionSteps)
      ? resolutionSteps.map((step, idx) => ({
          stepNumber: step.stepNumber || idx + 1,
          title: String(step.title || `Step ${idx + 1}`).trim(),
          instructions: String(step.instructions || '').trim(),
          codeSnippet: step.codeSnippet ? String(step.codeSnippet).trim() : undefined,
          cautionNotice: step.cautionNotice ? String(step.cautionNotice).trim() : undefined,
        }))
      : [];

    const newArticle: Article = {
      id,
      title: title.trim(),
      slug,
      summary: summary.trim(),
      categoryId,
      categoryName: category.name,
      content: content.trim(),
      resolutionSteps: steps,
      quickSnippet: quickSnippet.trim(),
      keywords: Array.isArray(keywords)
        ? keywords.map((k: string) => String(k).trim().toLowerCase())
        : title.toLowerCase().split(/\s+/),
      tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim().toLowerCase()) : ['support'],
      targetAudience: ['agents_only', 'public_and_agents', 'developers'].includes(targetAudience)
        ? targetAudience
        : 'public_and_agents',
      author: author ? String(author).trim() : 'Support Knowledge Team',
      reviewStatus: 'verified',
      lastReviewedAt: now,
      lastReviewedBy: author ? String(author).trim() : 'Initial Author',
      viewsCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      helpfulRatio: 1,
      outdatedReportsCount: 0,
      healthScore: 100,
      updateUrgency: 'healthy',
      urgencyReasons: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.articles.insertOne(newArticle);
    res.status(201).json({ article: newArticle, message: 'Article created successfully.' });
  } catch (err) {
    next(err);
  }
});

// 6. Update Article
apiRouter.put('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const db = await initDatabase();
    const current = await db.articles.findOne({ id });

    if (!current) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const {
      title,
      summary,
      categoryId,
      content,
      resolutionSteps,
      quickSnippet,
      keywords,
      tags,
      targetAudience,
      markAsReviewed,
      reviewerName,
      reviewNotes,
    } = req.body;

    const errors: string[] = [];
    if (title && (typeof title !== 'string' || title.trim().length < 5)) {
      errors.push('Article title must be at least 5 characters.');
    }
    if (summary && (typeof summary !== 'string' || summary.trim().length < 10)) {
      errors.push('Summary must be at least 10 characters.');
    }
    if (content && (typeof content !== 'string' || content.trim().length < 20)) {
      errors.push('Content must be at least 20 characters.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    let categoryName = current.categoryName;
    if (categoryId && categoryId !== current.categoryId) {
      const cat = await db.categories.findOne({ id: categoryId });
      if (cat) categoryName = cat.name;
    }

    const now = new Date().toISOString();
    let newReviewStatus: ReviewStatus = current.reviewStatus;
    let newLastReviewedAt = current.lastReviewedAt;
    let newLastReviewedBy = current.lastReviewedBy;
    let newOutdatedCount = current.outdatedReportsCount;

    // If author or editor marked this update as a formal review/refresh:
    if (markAsReviewed) {
      newReviewStatus = 'verified';
      newLastReviewedAt = now;
      newLastReviewedBy = reviewerName ? String(reviewerName).trim() : 'Knowledge Manager';
      // Reset outdated counter because the content was refreshed!
      newOutdatedCount = 0;

      // Log review audit entry
      await db.reviews.insertOne({
        id: `rev-${Date.now()}`,
        articleId: id,
        previousStatus: current.reviewStatus,
        newStatus: 'verified',
        reviewerName: newLastReviewedBy,
        notes: reviewNotes || 'Article content updated and verified current.',
        reviewedAt: now,
      });
    }

    const health = calculateArticleHealth(
      current.helpfulCount,
      current.notHelpfulCount,
      newOutdatedCount,
      newLastReviewedAt,
      newReviewStatus
    );

    const updateFields: Partial<Article> = {
      title: title ? title.trim() : current.title,
      summary: summary ? summary.trim() : current.summary,
      categoryId: categoryId || current.categoryId,
      categoryName,
      content: content ? content.trim() : current.content,
      quickSnippet: quickSnippet ? quickSnippet.trim() : current.quickSnippet,
      keywords: Array.isArray(keywords) ? keywords : current.keywords,
      tags: Array.isArray(tags) ? tags : current.tags,
      targetAudience: targetAudience || current.targetAudience,
      updatedAt: now,
      reviewStatus: health.suggestedStatus,
      lastReviewedAt: newLastReviewedAt,
      lastReviewedBy: newLastReviewedBy,
      outdatedReportsCount: newOutdatedCount,
      healthScore: health.healthScore,
      helpfulRatio: health.helpfulRatio,
      updateUrgency: health.updateUrgency,
      urgencyReasons: health.urgencyReasons,
    };

    if (Array.isArray(resolutionSteps)) {
      updateFields.resolutionSteps = resolutionSteps;
    }

    await db.articles.updateOne({ id }, { $set: updateFields });
    const updated = await db.articles.findOne({ id });

    res.json({ article: updated, message: 'Article updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// 7. Delete Article
apiRouter.delete('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const db = await initDatabase();
    const success = await db.articles.deleteOne({ id });

    if (!success) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    res.json({ message: 'Article deleted successfully.', id });
  } catch (err) {
    next(err);
  }
});

// 8. Submit Feedback (Differentiating Feature Engine)
apiRouter.post('/articles/:id/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isHelpful, reason, userRole, comments, suggestedCorrection } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({ error: 'Field "isHelpful" (boolean) is required.' });
    }

    const db = await initDatabase();
    const article = await db.articles.findOne({ id });

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const now = new Date().toISOString();
    const feedbackItem: FeedbackItem = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      articleId: id,
      isHelpful,
      reason,
      userRole: userRole || 'support_agent',
      comments: comments ? String(comments).trim() : undefined,
      suggestedCorrection: suggestedCorrection ? String(suggestedCorrection).trim() : undefined,
      createdAt: now,
    };

    await db.feedback.insertOne(feedbackItem);

    // Calculate new metrics
    const newHelpful = isHelpful ? article.helpfulCount + 1 : article.helpfulCount;
    const newNotHelpful = !isHelpful ? article.notHelpfulCount + 1 : article.notHelpfulCount;
    const isOutdatedReport = !isHelpful && (reason === 'outdated_steps' || reason === 'incorrect_info');
    const newOutdatedCount = isOutdatedReport ? article.outdatedReportsCount + 1 : article.outdatedReportsCount;

    const health = calculateArticleHealth(
      newHelpful,
      newNotHelpful,
      newOutdatedCount,
      article.lastReviewedAt,
      article.reviewStatus
    );

    // Update article state
    await db.articles.updateOne(
      { id },
      {
        $set: {
          helpfulCount: newHelpful,
          notHelpfulCount: newNotHelpful,
          helpfulRatio: health.helpfulRatio,
          outdatedReportsCount: newOutdatedCount,
          healthScore: health.healthScore,
          updateUrgency: health.updateUrgency,
          urgencyReasons: health.urgencyReasons,
          reviewStatus: health.suggestedStatus,
          updatedAt: now,
        },
      }
    );

    const updatedArticle = await db.articles.findOne({ id });

    res.status(201).json({
      message: 'Feedback recorded successfully.',
      feedback: feedbackItem,
      articleUpdate: {
        healthScore: health.healthScore,
        updateUrgency: health.updateUrgency,
        reviewStatus: health.suggestedStatus,
        urgencyReasons: health.urgencyReasons,
      },
      article: updatedArticle,
    });
  } catch (err) {
    next(err);
  }
});

// 9. Update Review Status (Support Lead / Reviewer Workflow)
apiRouter.post('/articles/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reviewerName, notes } = req.body;

    const validStatuses: ReviewStatus[] = ['verified', 'under_review', 'needs_review', 'outdated'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid review status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const db = await initDatabase();
    const article = await db.articles.findOne({ id });

    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const now = new Date().toISOString();
    const reviewer = reviewerName ? String(reviewerName).trim() : 'Lead Reviewer';

    // Create review log
    const reviewLog: ReviewLog = {
      id: `rev-${Date.now()}`,
      articleId: id,
      previousStatus: article.reviewStatus,
      newStatus: status,
      reviewerName: reviewer,
      notes: notes ? String(notes).trim() : `Status transitioned to ${status}`,
      reviewedAt: now,
    };

    await db.reviews.insertOne(reviewLog);

    // If verified, reset outdated count and refresh review date
    const resetOutdated = status === 'verified' ? 0 : article.outdatedReportsCount;
    const newLastReviewed = status === 'verified' ? now : article.lastReviewedAt;

    const health = calculateArticleHealth(
      article.helpfulCount,
      article.notHelpfulCount,
      resetOutdated,
      newLastReviewed,
      status
    );

    await db.articles.updateOne(
      { id },
      {
        $set: {
          reviewStatus: status,
          lastReviewedAt: newLastReviewed,
          lastReviewedBy: reviewer,
          outdatedReportsCount: resetOutdated,
          healthScore: health.healthScore,
          updateUrgency: health.updateUrgency,
          urgencyReasons: health.urgencyReasons,
          updatedAt: now,
        },
      }
    );

    const updated = await db.articles.findOne({ id });
    res.json({
      message: `Article review status changed to ${status}.`,
      reviewLog,
      article: updated,
    });
  } catch (err) {
    next(err);
  }
});

// 10. Metrics & Feedback Intelligence Dashboard
apiRouter.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDatabase();
    const articles = await db.articles.find();
    const allFeedback = await db.feedback.find();

    const totalArticles = articles.length;
    const verifiedCount = articles.filter((a) => a.reviewStatus === 'verified').length;
    const needsReviewCount = articles.filter((a) => a.reviewStatus === 'needs_review').length;
    const underReviewCount = articles.filter((a) => a.reviewStatus === 'under_review').length;
    const outdatedCount = articles.filter((a) => a.reviewStatus === 'outdated').length;

    const urgentArticles = articles
      .filter((a) => a.updateUrgency === 'urgent' || a.updateUrgency === 'warning')
      .sort((a, b) => a.healthScore - b.healthScore);

    const totalFeedbackCount = allFeedback.length;
    const positiveFeedbackCount = allFeedback.filter((f) => f.isHelpful).length;
    const overallHelpfulRatio =
      totalFeedbackCount === 0 ? 1 : Number((positiveFeedbackCount / totalFeedbackCount).toFixed(2));

    // Reasons breakdown
    const reasonCounts: Record<string, number> = {};
    for (const fb of allFeedback) {
      if (fb.reason) {
        reasonCounts[fb.reason] = (reasonCounts[fb.reason] || 0) + 1;
      }
    }

    res.json({
      summary: {
        totalArticles,
        verifiedCount,
        needsReviewCount,
        underReviewCount,
        outdatedCount,
        urgentCount: urgentArticles.length,
        overallHelpfulRate: Math.round(overallHelpfulRatio * 100),
        totalFeedbackCount,
        positiveFeedbackCount,
      },
      reasonBreakdown: reasonCounts,
      urgentArticlesQueue: urgentArticles,
    });
  } catch (err) {
    next(err);
  }
});

// 11. Reset Seed Data (Useful for testing)
apiRouter.post('/seed/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await initDatabase();
    await db.resetSeedData();
    res.json({ message: 'Knowledge base successfully reset to initial rich support dataset.' });
  } catch (err) {
    next(err);
  }
});
