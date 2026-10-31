import { Router } from 'express';
import { getSystemHealthAndSupport, getAuditLogs } from '../controllers/support.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/health', getSystemHealthAndSupport);
router.get('/audit-logs', requireOwner, getAuditLogs);

export default router;
