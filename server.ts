import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes';
import { initDatabase } from './server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB (MongoDB or resilient local JSON engine)
  try {
    await initDatabase();
  } catch (err) {
    console.error('Database initialization warning:', err);
  }

  // REST API Routes
  app.use('/api', apiRouter);

  // Centralized Error Handler for API
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      details: err.details || undefined,
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static client assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HelpdeskKnowledge Base server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
