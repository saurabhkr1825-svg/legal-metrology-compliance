import { Router } from 'express';
import { loginHandler, getCurrentUserHandler, refreshTokenHandler, logoutHandler } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', requireAuth, logoutHandler);
router.get('/me', requireAuth, getCurrentUserHandler);

export default router;
