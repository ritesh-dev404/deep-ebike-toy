import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import authRoutes from './routes/auth.routes';
import { ENV } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows flexible inline resources & styles
  })
);

// Configured allowed origins from FRONTEND_URL environment variable
const configuredFrontendUrls = ENV.FRONTEND_URL
  ? ENV.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

// Dynamic CORS configuration allowing Vercel domain, local development, and Electron desktop
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Electron desktop apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If in development mode or wildcard allowed, permit all
      if (ENV.NODE_ENV === 'development' || configuredFrontendUrls.includes('*')) {
        return callback(null, true);
      }

      // Check if origin matches FRONTEND_URL or Vercel preview deployment
      const isAllowed =
        configuredFrontendUrls.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');

      if (isAllowed || configuredFrontendUrls.length === 0) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all /api endpoints
app.use('/api', apiLimiter);

// System health check
app.get('/api/health', (req, res) => {
  const isPostgresActive = Boolean(
    process.env.DATABASE_TYPE === 'postgresql' ||
    process.env.DATABASE_TYPE === 'postgres' ||
    (process.env.NEON_DATABASE_URL && (process.env.NEON_DATABASE_URL.startsWith('postgresql://') || process.env.NEON_DATABASE_URL.startsWith('postgres://'))) ||
    (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://')))
  );

  const neonScheme = process.env.NEON_DATABASE_URL ? (process.env.NEON_DATABASE_URL.split(':')[0] || 'unknown') : 'not_set';
  const dbScheme = process.env.DATABASE_URL ? (process.env.DATABASE_URL.split(':')[0] || 'unknown') : 'not_set';

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'DEEP E-BIKE & TOY POS API',
    version: '1.0.0-PROD',
    database: {
      type: isPostgresActive ? 'Neon PostgreSQL (Cloud)' : 'SQLite (Offline)',
      neonConfigured: neonScheme.startsWith('postgres'),
      databaseUrlConfigured: dbScheme.startsWith('postgres'),
      neonScheme,
    },
  });
});

// Main API routes
app.use('/api', routes);

// Auth aliases to prevent 404s when requests are made without /api prefix
app.use('/auth', authRoutes);

// Serve Static Frontend if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

export default app;
