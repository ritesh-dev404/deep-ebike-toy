import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./deep_pos.db',
  JWT_SECRET: process.env.JWT_SECRET || 'deep_ebike_toy_jwt_secret_secure_key_2026_retail_pro',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REMOTE_API_URL: process.env.REMOTE_API_URL || '',
  AUTO_SYNC_ENABLED: process.env.AUTO_SYNC_ENABLED === 'true',
  SYNC_INTERVAL_SECONDS: process.env.SYNC_INTERVAL_SECONDS ? parseInt(process.env.SYNC_INTERVAL_SECONDS, 10) : 30,
};
