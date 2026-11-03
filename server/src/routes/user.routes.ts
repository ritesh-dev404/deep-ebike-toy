import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getUserPerformance,
  getRolesAndPermissions,
  updateRolePermissions,
} from '../controllers/user.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireOwner);

router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/system/roles-permissions', getRolesAndPermissions);
router.put('/system/roles/:roleName/permissions', updateRolePermissions);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleUserStatus);
router.post('/:id/reset-password', resetUserPassword);
router.get('/:id/performance', getUserPerformance);

export default router;
