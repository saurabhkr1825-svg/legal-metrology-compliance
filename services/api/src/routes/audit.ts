import { Router } from 'express';
import { listAuditLogsHandler } from '../controllers/audit.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]),
  listAuditLogsHandler
);

export default router;
