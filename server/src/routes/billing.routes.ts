import { Router } from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  cancelBill,
  printInvoicePdf,
} from '../controllers/billing.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createBill);
router.get('/', getAllBills);
router.get('/:id', getBillById);
router.post('/:id/cancel', cancelBill);
router.get('/:id/pdf', printInvoicePdf);

export default router;
