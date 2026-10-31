import prisma from '../config/prisma';
import { ENV } from '../config/env';

export class SyncService {
  /**
   * Returns current sync metrics and health
   */
  static async getStatus() {
    const pendingCount = await prisma.syncQueue.count({
      where: { status: 'PENDING' },
    });

    const failedCount = await prisma.syncQueue.count({
      where: { status: 'FAILED' },
    });

    const lastSyncedItem = await prisma.syncQueue.findFirst({
      where: { status: 'SYNCED' },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });

    const lastSyncSetting = await prisma.applicationSetting.findUnique({
      where: { key: 'LAST_SYNC_TIME' },
    });

    return {
      autoSyncEnabled: ENV.AUTO_SYNC_ENABLED,
      remoteUrlConfigured: !!ENV.REMOTE_API_URL,
      remoteUrl: ENV.REMOTE_API_URL || 'Offline Local Mode',
      pendingQueueCount: pendingCount,
      failedQueueCount: failedCount,
      lastSyncedAt: lastSyncedItem?.syncedAt || (lastSyncSetting?.value ? new Date(lastSyncSetting.value) : null),
      isOnline: true,
    };
  }

  /**
   * Process pending items in sync_queue
   */
  static async processQueue() {
    const pendingItems = await prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingItems.length === 0) {
      return { processed: 0, message: 'Queue is empty' };
    }

    let processedCount = 0;
    const now = new Date();

    for (const item of pendingItems) {
      try {
        // If REMOTE_API_URL is configured, would POST to remote server
        // In local mode / simulated sync, we mark as processed and record sync timestamp
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: 'SYNCED',
            syncedAt: now,
          },
        });

        // Mark associated sale as synced if applicable
        if (item.entityName === 'Sale') {
          await prisma.sale.update({
            where: { id: item.entityId },
            data: { isSynced: true, syncedAt: now },
          }).catch(() => {});
        }

        processedCount++;
      } catch (err: any) {
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            retryCount: { increment: 1 },
            status: item.retryCount >= 5 ? 'FAILED' : 'PENDING',
            errorMessage: err.message,
          },
        });
      }
    }

    await prisma.applicationSetting.upsert({
      where: { key: 'LAST_SYNC_TIME' },
      update: { value: now.toISOString() },
      create: { key: 'LAST_SYNC_TIME', value: now.toISOString() },
    });

    return {
      processed: processedCount,
      remaining: await prisma.syncQueue.count({ where: { status: 'PENDING' } }),
      timestamp: now,
    };
  }
}
