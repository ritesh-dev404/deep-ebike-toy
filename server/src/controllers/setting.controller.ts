import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.applicationSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.json({ success: true, data: settingsMap });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const newSettings: Record<string, string> = req.body;

    for (const [key, value] of Object.entries(newSettings)) {
      await prisma.applicationSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_SETTINGS',
      entityName: 'Settings',
      newValues: newSettings,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDatabaseBackup = async (req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../prisma/deep_pos.db');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, message: 'Database file not found' });
    }

    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `deep_pos_backup_${timestamp}.db`;
    const targetPath = path.join(backupDir, backupFileName);

    fs.copyFileSync(dbPath, targetPath);

    // Update setting with last backup time
    await prisma.applicationSetting.upsert({
      where: { key: 'LAST_BACKUP_TIME' },
      update: { value: new Date().toISOString() },
      create: { key: 'LAST_BACKUP_TIME', value: new Date().toISOString() },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_BACKUP',
      entityName: 'Database',
      entityId: backupFileName,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        fileName: backupFileName,
        path: targetPath,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadDatabaseBackup = async (req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../prisma/deep_pos.db');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, message: 'Database file not found' });
    }

    res.download(dbPath, `deep_ebike_backup_${Date.now()}.db`);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
