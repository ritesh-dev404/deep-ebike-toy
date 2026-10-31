import { Router } from 'express';
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
} from '../controllers/supplier.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllSuppliers);
router.post('/', requireOwner, createSupplier);
router.put('/:id', requireOwner, updateSupplier);

export default router;
