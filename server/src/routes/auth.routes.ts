import { Router } from 'express';
import { login, getProfile, changePassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', loginLimiter, login);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;
