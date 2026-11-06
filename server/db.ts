import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import { Article, Category, FeedbackItem, ReviewLog } from './models';
import { getInitialArticles, initialCategories, initialFeedbackItems } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'kb_database.json');

export interface DatabaseAdapter {
  type: 'mongodb' | 'embedded_mongodb_store';
  status: string;
  articles: {
    find: (filter?: any, sort?: any) => Promise<Article[]>;
    findOne: (filter: any) => Promise<Article | null>;
    insertOne: (doc: Article) => Promise<Article>;
    updateOne: (filter: any, update: any) => Promise<boolean>;
    deleteOne: (filter: any) => Promise<boolean>;
    countDocuments: (filter?: any) => Promise<number>;
  };
  categories: {
    find: (filter?: any) => Promise<Category[]>;
    findOne: (filter: any) => Promise<Category | null>;
    insertOne: (doc: Category) => Promise<Category>;
  };
  feedback: {
    find: (filter?: any) => Promise<FeedbackItem[]>;
    insertOne: (doc: FeedbackItem) => Promise<FeedbackItem>;
  };
  reviews: {
    find: (filter?: any) => Promise<ReviewLog[]>;
    insertOne: (doc: ReviewLog) => Promise<ReviewLog>;
  };
  resetSeedData: () => Promise<void>;
}

interface StoredData {
  articles: Article[];
  categories: Category[];
  feedback: FeedbackItem[];
  reviews: ReviewLog[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadEmbeddedData(): StoredData {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.articles) && data.articles.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to parse existing data file, re-initializing seed data:', e);
    }
  }

  const initialData: StoredData = {
    articles: getInitialArticles(),
    categories: initialCategories,
    feedback: initialFeedbackItems,
    reviews: [
      {
        id: 'rev-001',
        articleId: 'art-saml-sso-certs',
        previousStatus: 'under_review',
        newStatus: 'verified',
        reviewerName: 'Elena Rostova',
        notes: 'Updated metadata schema verification steps and confirmed NTP time drift margin.',
        reviewedAt: '2026-10-15T09:00:00Z',
      },
      {
        id: 'rev-002',
        articleId: 'art-prorated-billing-refunds',
        previousStatus: 'needs_review',
        newStatus: 'verified',
        reviewerName: 'Sarah Chen',
        notes: 'Refreshed Stripe customer credit ledger navigation instructions for billing agents.',
        reviewedAt: '2026-10-02T14:30:00Z',
      },
    ],
  };

  saveEmbeddedData(initialData);
  return initialData;
}

function saveEmbeddedData(data: StoredData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Embedded MongoDB-compatible store implementation
function createEmbeddedAdapter(): DatabaseAdapter {
  let memoryData = loadEmbeddedData();

  return {
    type: 'embedded_mongodb_store',
    status: 'Operational (File-Persisted MongoDB Document Engine)',
    articles: {
      find: async (filter = {}, sort = {}) => {
        let results = [...memoryData.articles];

        if (filter.categoryId) {
          results = results.filter((a) => a.categoryId === filter.categoryId);
        }
        if (filter.reviewStatus && filter.reviewStatus !== 'all') {
          results = results.filter((a) => a.reviewStatus === filter.reviewStatus);
        }
        if (filter.targetAudience) {
          results = results.filter((a) => a.targetAudience === filter.targetAudience);
        }
        if (filter.updateUrgency) {
          results = results.filter((a) => a.updateUrgency === filter.updateUrgency);
        }
        if (filter.needsUpdate === true) {
          results = results.filter((a) => a.updateUrgency === 'urgent' || a.updateUrgency === 'warning' || a.reviewStatus === 'needs_review' || a.reviewStatus === 'outdated');
        }
        if (filter.$text && filter.$text.$search) {
          const q = String(filter.$text.$search).toLowerCase().trim();
          results = results.filter((a) => {
            return (
              a.title.toLowerCase().includes(q) ||
              a.summary.toLowerCase().includes(q) ||
              a.content.toLowerCase().includes(q) ||
              a.quickSnippet.toLowerCase().includes(q) ||
              a.categoryName.toLowerCase().includes(q) ||
              a.keywords.some((k) => k.toLowerCase().includes(q)) ||
              a.tags.some((t) => t.toLowerCase().includes(q)) ||
              a.resolutionSteps.some((s) => s.title.toLowerCase().includes(q) || s.instructions.toLowerCase().includes(q))
            );
          });
        }

        // Sorting
        if (sort.healthScore) {
          results.sort((a, b) => (sort.healthScore === 1 ? a.healthScore - b.healthScore : b.healthScore - a.healthScore));
        } else if (sort.viewsCount) {
          results.sort((a, b) => b.viewsCount - a.viewsCount);
        } else if (sort.helpfulRatio) {
          results.sort((a, b) => b.helpfulRatio - a.helpfulRatio);
        } else if (sort.updatedAt) {
          results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }

        return results;
      },
      findOne: async (filter) => {
        return memoryData.articles.find((a) => a.id === filter.id || a.slug === filter.slug) || null;
      },
      insertOne: async (doc) => {
        memoryData.articles.unshift(doc);
        saveEmbeddedData(memoryData);
        return doc;
      },
      updateOne: async (filter, update) => {
        const index = memoryData.articles.findIndex((a) => a.id === filter.id);
        if (index === -1) return false;

        const current = memoryData.articles[index];
        const updated = {
          ...current,
          ...(update.$set || update),
        };

        if (update.$inc) {
          for (const key of Object.keys(update.$inc)) {
            // @ts-ignore
            updated[key] = (updated[key] || 0) + update.$inc[key];
          }
        }

        memoryData.articles[index] = updated;
        saveEmbeddedData(memoryData);
        return true;
      },
      deleteOne: async (filter) => {
        const initialLen = memoryData.articles.length;
        memoryData.articles = memoryData.articles.filter((a) => a.id !== filter.id);
        const changed = memoryData.articles.length !== initialLen;
        if (changed) saveEmbeddedData(memoryData);
        return changed;
      },
      countDocuments: async (filter = {}) => {
        if (!filter || Object.keys(filter).length === 0) return memoryData.articles.length;
        let list = [...memoryData.articles];
        if (filter.reviewStatus) list = list.filter((a) => a.reviewStatus === filter.reviewStatus);
        if (filter.updateUrgency) list = list.filter((a) => a.updateUrgency === filter.updateUrgency);
        return list.length;
      },
    },
    categories: {
      find: async () => [...memoryData.categories].sort((a, b) => a.displayOrder - b.displayOrder),
      findOne: async (filter) => memoryData.categories.find((c) => c.id === filter.id || c.slug === filter.slug) || null,
      insertOne: async (doc) => {
        memoryData.categories.push(doc);
        saveEmbeddedData(memoryData);
        return doc;
      },
    },
    feedback: {
      find: async (filter = {}) => {
        let results = [...memoryData.feedback];
        if (filter.articleId) {
          results = results.filter((f) => f.articleId === filter.articleId);
        }
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      insertOne: async (doc) => {
        memoryData.feedback.unshift(doc);
        saveEmbeddedData(memoryData);
        return doc;
      },
    },
    reviews: {
      find: async (filter = {}) => {
        let results = [...memoryData.reviews];
        if (filter.articleId) {
          results = results.filter((r) => r.articleId === filter.articleId);
        }
        return results.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
      },
      insertOne: async (doc) => {
        memoryData.reviews.unshift(doc);
        saveEmbeddedData(memoryData);
        return doc;
      },
    },
    resetSeedData: async () => {
      memoryData = {
        articles: getInitialArticles(),
        categories: initialCategories,
        feedback: initialFeedbackItems,
        reviews: [],
      };
      saveEmbeddedData(memoryData);
    },
  };
}

let dbInstance: DatabaseAdapter | null = null;

export async function initDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;

  if (mongoUri) {
    try {
      console.log(`Connecting to MongoDB cluster at ${mongoUri.replace(/:[^:@]+@/, ':****@')}...`);
      const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      const db: Db = client.db('helpdesk_kb');

      const articlesCol = db.collection<Article>('articles');
      const categoriesCol = db.collection<Category>('categories');
      const feedbackCol = db.collection<FeedbackItem>('feedback');
      const reviewsCol = db.collection<ReviewLog>('reviews');

      // Seed if empty
      const existingCount = await articlesCol.countDocuments();
      if (existingCount === 0) {
        console.log('Seeding initial articles and categories into MongoDB...');
        await articlesCol.insertMany(getInitialArticles());
        await categoriesCol.insertMany(initialCategories);
        await feedbackCol.insertMany(initialFeedbackItems);
      }

      dbInstance = {
        type: 'mongodb',
        status: 'Connected to Live MongoDB Database',
        articles: {
          find: async (filter = {}, sort = {}) => {
            let mongoFilter: any = {};
            if (filter.categoryId) mongoFilter.categoryId = filter.categoryId;
            if (filter.reviewStatus && filter.reviewStatus !== 'all') mongoFilter.reviewStatus = filter.reviewStatus;
            if (filter.targetAudience) mongoFilter.targetAudience = filter.targetAudience;
            if (filter.updateUrgency) mongoFilter.updateUrgency = filter.updateUrgency;
            if (filter.needsUpdate === true) {
              mongoFilter.$or = [
                { updateUrgency: 'urgent' },
                { updateUrgency: 'warning' },
                { reviewStatus: 'needs_review' },
                { reviewStatus: 'outdated' },
              ];
            }
            if (filter.$text && filter.$text.$search) {
              const q = filter.$text.$search;
              mongoFilter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { summary: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { quickSnippet: { $regex: q, $options: 'i' } },
                { keywords: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
              ];
            }
            return (await articlesCol.find(mongoFilter).sort(sort).toArray()) as Article[];
          },
          findOne: async (filter) => {
            const query = filter.id ? { id: filter.id } : { slug: filter.slug };
            return (await articlesCol.findOne(query)) as Article | null;
          },
          insertOne: async (doc) => {
            await articlesCol.insertOne(doc as any);
            return doc;
          },
          updateOne: async (filter, update) => {
            const res = await articlesCol.updateOne({ id: filter.id }, update);
            return res.modifiedCount > 0;
          },
          deleteOne: async (filter) => {
            const res = await articlesCol.deleteOne({ id: filter.id });
            return res.deletedCount > 0;
          },
          countDocuments: async (filter = {}) => {
            return await articlesCol.countDocuments(filter);
          },
        },
        categories: {
          find: async () => (await categoriesCol.find().sort({ displayOrder: 1 }).toArray()) as Category[],
          findOne: async (filter) => (await categoriesCol.findOne(filter)) as Category | null,
          insertOne: async (doc) => {
            await categoriesCol.insertOne(doc as any);
            return doc;
          },
        },
        feedback: {
          find: async (filter = {}) => (await feedbackCol.find(filter).sort({ createdAt: -1 }).toArray()) as FeedbackItem[],
          insertOne: async (doc) => {
            await feedbackCol.insertOne(doc as any);
            return doc;
          },
        },
        reviews: {
          find: async (filter = {}) => (await reviewsCol.find(filter).sort({ reviewedAt: -1 }).toArray()) as ReviewLog[],
          insertOne: async (doc) => {
            await reviewsCol.insertOne(doc as any);
            return doc;
          },
        },
        resetSeedData: async () => {
          await articlesCol.deleteMany({});
          await categoriesCol.deleteMany({});
          await feedbackCol.deleteMany({});
          await reviewsCol.deleteMany({});
          await articlesCol.insertMany(getInitialArticles());
          await categoriesCol.insertMany(initialCategories);
          await feedbackCol.insertMany(initialFeedbackItems);
        },
      };

      console.log('MongoDB successfully connected and initialized.');
      return dbInstance;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to embedded MongoDB engine:', err);
    }
  }

  // Fallback to Embedded MongoDB-compatible store
  console.log('Using Embedded MongoDB-compatible file-persisted document engine at ./data/kb_database.json');
  dbInstance = createEmbeddedAdapter();
  return dbInstance;
}
