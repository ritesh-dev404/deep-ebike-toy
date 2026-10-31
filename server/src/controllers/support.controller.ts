import { Request, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';

export const getSystemHealthAndSupport = async (req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../prisma/deep_pos.db');
    let dbSize = '0 MB';
    let dbExists = false;

    if (fs.existsSync(dbPath)) {
      dbExists = true;
      const stats = fs.statSync(dbPath);
      dbSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    const lastBackup = await prisma.applicationSetting.findUnique({
      where: { key: 'LAST_BACKUP_TIME' },
    });

    const lastSync = await prisma.applicationSetting.findUnique({
      where: { key: 'LAST_SYNC_TIME' },
    });

    const totalUsers = await prisma.user.count();
    const totalSales = await prisma.sale.count();
    const totalProducts = await prisma.product.count();

    const memTotal = Math.round(os.totalmem() / (1024 * 1024));
    const memFree = Math.round(os.freemem() / (1024 * 1024));
    const memUsed = memTotal - memFree;

    const data = {
      app: {
        name: 'DEEP E-BIKE & TOY Retail POS & Management System',
        version: '1.0.0-PROD',
        environment: process.env.NODE_ENV || 'production',
        mode: 'Offline-First Desktop / Online Hybrid',
        latestVersion: '1.0.0-PROD',
        updateAvailable: false,
      },
      database: {
        provider: 'SQLite (Offline Capable)',
        status: dbExists ? 'Connected & Healthy' : 'Warning',
        size: dbSize,
        totalProducts,
        totalSales,
        totalUsers,
      },
      system: {
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: `${memUsed} MB / ${memTotal} MB`,
        hostname: os.hostname(),
      },
      maintenance: {
        lastBackup: lastBackup?.value || 'No recent backup recorded',
        lastSync: lastSync?.value || 'Synchronized locally',
      },
      supportContact: {
        company: 'DEEP E-BIKE & TOY IT Systems',
        helpline: '+91 98765 43210 / +91 91234 56789',
        email: 'support@deepebikeandtoy.com',
        workingHours: 'Mon - Sun: 10:00 AM - 9:00 PM IST',
        remoteSupportNote:
          'Remote desktop assistance requires explicit store manager authorization before initiating screen-sharing.',
      },
    };

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { limit = '100', action } = req.query;
    const where: any = {};

    if (action && typeof action === 'string') {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
    });

    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
