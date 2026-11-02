import app from './app';
import { ENV } from './config/env';
import { isUsingPostgres } from './config/prisma';
import { SyncService } from './services/sync.service';

const PORT = ENV.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 DEEP E-BIKE & TOY POS SERVER RUNNING ON PORT ${PORT}`);
  console.log(`⚡ Mode: ${ENV.NODE_ENV.toUpperCase()}`);
  console.log(`📦 Database: ${isUsingPostgres ? 'Neon PostgreSQL (Cloud Mode)' : 'SQLite (Offline Mode)'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);

  // Start background auto-synchronization worker
  if (ENV.AUTO_SYNC_ENABLED) {
    const intervalMs = ENV.SYNC_INTERVAL_SECONDS * 1000;
    console.log(`🔄 Auto-sync worker initialized (polling every ${ENV.SYNC_INTERVAL_SECONDS}s)`);
    setInterval(async () => {
      try {
        await SyncService.processQueue();
      } catch (err: any) {
        console.error('Background sync worker error:', err.message);
      }
    }, intervalMs);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});
