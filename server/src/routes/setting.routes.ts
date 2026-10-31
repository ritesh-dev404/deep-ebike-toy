import { Router } from 'express';
import {
  getAllSettings,
  updateSettings,
  createDatabaseBackup,
  downloadDatabaseBackup,
} from '../controllers/setting.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllSettings);
router.put('/', requireOwner, updateSettings);
router.post('/backup', requireOwner, createDatabaseBackup);
router.get('/backup/download', requireOwner, downloadDatabaseBackup);

export default router;
