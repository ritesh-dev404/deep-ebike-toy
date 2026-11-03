import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
} from '../controllers/customer.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllCustomers);
router.get('/phone/:phone', getCustomerByPhone);
router.post('/', requirePermission('CUSTOMERS_MANAGE'), createCustomer);
router.put('/:id', requirePermission('CUSTOMERS_MANAGE'), updateCustomer);

export default router;
