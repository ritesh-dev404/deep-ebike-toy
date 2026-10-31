import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
} from '../controllers/customer.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllCustomers);
router.get('/phone/:phone', getCustomerByPhone);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

export default router;
