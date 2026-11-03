import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
  changePassword,
  getSetupStatus,
  initialSetup,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Setup routes
router.get('/setup-status', getSetupStatus);
router.post('/setup', loginLimiter, initialSetup);

// Auth session routes
router.post('/login', loginLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;
