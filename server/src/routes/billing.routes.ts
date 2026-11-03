import { Router } from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  cancelBill,
  printInvoicePdf,
} from '../controllers/billing.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', requirePermission('SALES_CREATE'), createBill);
router.get('/', requirePermission('SALES_READ'), getAllBills);
router.get('/:id', requirePermission('SALES_READ'), getBillById);
router.post('/:id/cancel', requirePermission('SALES_CANCEL'), cancelBill);
router.get('/:id/pdf', printInvoicePdf);

export default router;
