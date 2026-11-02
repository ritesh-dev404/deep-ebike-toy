import dotenv from 'dotenv';
dotenv.config();

const defaultDevSecret = 'deep_ebike_toy_jwt_dev_secret_key_2026';
const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.includes('placeholder') || configuredSecret === defaultDevSecret)) {
  console.warn('⚠️ SECURITY WARNING: Please set a secure, unique JWT_SECRET in Render Environment Variables before going live.');
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_TYPE: process.env.DATABASE_TYPE || (process.env.NEON_DATABASE_URL && !process.env.NEON_DATABASE_URL.includes('placeholder') ? 'postgresql' : 'sqlite'),
  DATABASE_URL: process.env.DATABASE_URL || 'file:./deep_pos.db',
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || '',
  JWT_SECRET: configuredSecret || defaultDevSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  REMOTE_API_URL: process.env.REMOTE_API_URL || '',
  AUTO_SYNC_ENABLED: process.env.AUTO_SYNC_ENABLED === 'true',
  SYNC_INTERVAL_SECONDS: process.env.SYNC_INTERVAL_SECONDS ? parseInt(process.env.SYNC_INTERVAL_SECONDS, 10) : 30,
};
