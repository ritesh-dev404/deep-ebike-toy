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
const isPostgres = Boolean(
  process.env.DATABASE_TYPE === 'postgresql' ||
  process.env.DATABASE_TYPE === 'postgres' ||
  (process.env.DATABASE_TYPE !== 'sqlite' &&
   ((ENV.NEON_DATABASE_URL && !ENV.NEON_DATABASE_URL.includes('placeholder')) ||
    (ENV.DATABASE_URL && (ENV.DATABASE_URL.startsWith('postgresql://') || ENV.DATABASE_URL.startsWith('postgres://')))))
);

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
  ? (ENV.NEON_DATABASE_URL && !ENV.NEON_DATABASE_URL.includes('placeholder')
      ? ENV.NEON_DATABASE_URL
      : ENV.DATABASE_URL)
  : resolveSqliteUrl(ENV.DATABASE_URL || 'file:./deep_pos.db');

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
