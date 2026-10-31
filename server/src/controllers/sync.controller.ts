import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';

export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    const status = await SyncService.getStatus();
    return res.json({ success: true, data: status });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerManualSync = async (req: Request, res: Response) => {
  try {
    const result = await SyncService.processQueue();
    return res.json({
      success: true,
      message: `Sync completed: ${result.processed} items synchronized`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
