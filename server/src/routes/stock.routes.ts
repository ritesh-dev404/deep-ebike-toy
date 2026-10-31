import { Router } from 'express';
import {
  getStockOverview,
  getStockMovements,
  adjustStock,
  getSerialNumbers,
} from '../controllers/stock.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/overview', getStockOverview);
router.get('/movements', getStockMovements);
router.get('/serial-numbers', getSerialNumbers);
router.post('/adjust', requireOwner, adjustStock);

export default router;
