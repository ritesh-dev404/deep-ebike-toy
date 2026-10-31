import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
} from '../controllers/user.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireOwner);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;
