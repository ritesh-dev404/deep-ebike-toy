import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
  changePassword,
  getSetupStatus,
  initialSetup,
  registerEmployee,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Setup routes
router.get('/setup-status', getSetupStatus);
router.post('/setup', loginLimiter, initialSetup);

// Auth session & registration routes
router.post('/login', loginLimiter, login);
router.post('/register-employee', loginLimiter, registerEmployee);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;
