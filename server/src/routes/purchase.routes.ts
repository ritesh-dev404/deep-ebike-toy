import { Router } from 'express';
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
} from '../controllers/purchase.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', requireOwner, createPurchase);

export default router;
