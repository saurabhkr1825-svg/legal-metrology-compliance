import { Router } from 'express';
import { listUsersHandler, getUserByIdHandler } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]),
  listUsersHandler
);

router.get('/:id', getUserByIdHandler);

export default router;
