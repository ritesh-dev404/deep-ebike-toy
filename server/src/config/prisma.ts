import fs from 'fs';
import path from 'path';
import { PrismaClient as SQLitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client-postgres';
import { ENV } from './env';

/**
 * Dynamic Dual-Database Prisma Client:
 * 
 * 1. CLOUD MODE (Neon PostgreSQL on Render):
 *    Activated when DATABASE_TYPE is 'postgresql' or NEON_DATABASE_URL is provided.
 *    Uses isolated PostgreSQL Prisma Client generated from schema.postgres.prisma.
 * 
 * 2. DESKTOP / OFFLINE MODE (Local SQLite):
 *    Activated when DATABASE_TYPE is 'sqlite' or for local Electron POS.
 *    Uses default SQLite Prisma Client with robust path resolution.
 */
function cleanUrlString(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const rawNeon = cleanUrlString(ENV.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL);
const rawDb = cleanUrlString(ENV.DATABASE_URL || process.env.DATABASE_URL);

const isPostgresUrl = (url: string) => url.startsWith('postgresql://') || url.startsWith('postgres://');

const effectivePostgresUrl = isPostgresUrl(rawNeon)
  ? rawNeon
  : isPostgresUrl(rawDb)
    ? rawDb
    : '';

const isPostgres = Boolean(
  process.env.DATABASE_TYPE === 'postgresql' ||
  process.env.DATABASE_TYPE === 'postgres' ||
  (process.env.DATABASE_TYPE !== 'sqlite' && Boolean(effectivePostgresUrl))
);

if (isPostgres) {
  if (effectivePostgresUrl) {
    process.env.NEON_DATABASE_URL = effectivePostgresUrl;
    process.env.DATABASE_URL = effectivePostgresUrl;
  }
} else {
  // Desktop Offline SQLite Mode
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = 'file:./deep_pos.db';
  }
}

function resolveSqliteUrl(rawUrl: string): string {
  if (!rawUrl.startsWith('file:')) return rawUrl;
  const rawPath = rawUrl.replace('file:', '').trim();
  if (path.isAbsolute(rawPath) && fs.existsSync(rawPath)) {
    return `file:${rawPath}`;
  }
  const cleanRelative = rawPath.replace(/^\.\//, '');
  const candidates = [
    path.resolve(process.cwd(), 'prisma', cleanRelative),
    path.resolve(process.cwd(), cleanRelative),
    path.resolve(__dirname, '../../prisma', cleanRelative),
    path.resolve(__dirname, '../prisma', cleanRelative),
    path.resolve(__dirname, '../../prisma/deep_pos.db'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return `file:${c}`;
    }
  }
  return `file:${path.resolve(__dirname, '../../prisma/deep_pos.db')}`;
}

const resolvedUrl = isPostgres
  ? (effectivePostgresUrl || 'postgresql://unconfigured:missing@localhost:5432/neondb')
  : resolveSqliteUrl(rawDb || 'file:./deep_pos.db');

export const isUsingPostgres = isPostgres;

export const prisma = (isPostgres
  ? new PostgresPrismaClient({
      datasources: { db: { url: resolvedUrl } },
      log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  : new SQLitePrismaClient({
      datasources: { db: { url: resolvedUrl } },
      log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })) as unknown as SQLitePrismaClient;

export default prisma;
