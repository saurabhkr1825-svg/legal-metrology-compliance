import { Router } from 'express';
import { loginHandler, getCurrentUserHandler } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', loginHandler);
router.get('/me', requireAuth, getCurrentUserHandler);

export default router;
