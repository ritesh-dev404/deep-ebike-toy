import { PrismaClient as SQLitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client-postgres';
import { ENV } from './env';

/**
 * Dynamic Dual-Database Prisma Client:
 * 
 * 1. CLOUD MODE (Neon PostgreSQL on Render):
 *    Activated when NEON_DATABASE_URL is provided (or DATABASE_URL starts with postgresql://).
 *    Uses isolated PostgreSQL Prisma Client generated from schema.postgres.prisma.
 * 
 * 2. DESKTOP / OFFLINE MODE (Local SQLite):
 *    Activated when DATABASE_URL is 'file:./deep_pos.db' or for local Electron POS.
 *    Uses default SQLite Prisma Client.
 */
const isPostgres = Boolean(
  process.env.DATABASE_TYPE !== 'sqlite' &&
  ((ENV.NEON_DATABASE_URL && !ENV.NEON_DATABASE_URL.includes('placeholder')) ||
   (ENV.DATABASE_URL && (ENV.DATABASE_URL.startsWith('postgresql://') || ENV.DATABASE_URL.startsWith('postgres://'))))
);

const resolvedUrl = isPostgres
  ? (ENV.NEON_DATABASE_URL && !ENV.NEON_DATABASE_URL.includes('placeholder')
      ? ENV.NEON_DATABASE_URL
      : ENV.DATABASE_URL)
  : (ENV.DATABASE_URL || 'file:./deep_pos.db');

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
