import { Router } from 'express';
import { getSyncStatus, triggerManualSync } from '../controllers/sync.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/status', getSyncStatus);
router.post('/trigger', triggerManualSync);

export default router;
