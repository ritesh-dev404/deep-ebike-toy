import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from '../controllers/category.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllCategories);
router.post('/', requireOwner, createCategory);
router.put('/:id', requireOwner, updateCategory);

export default router;
