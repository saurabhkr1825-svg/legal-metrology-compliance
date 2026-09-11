import { Router } from 'express';
import {
  createInspectionHandler,
  getInspectionByIdHandler,
  listInspectionsHandler,
  updateInspectionStatusHandler,
  reviewInspectionHandler,
} from '../controllers/inspection.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

// All inspection routes require authentication
router.use(requireAuth);

router.post('/', createInspectionHandler);
router.get('/', listInspectionsHandler);
router.get('/:id', getInspectionByIdHandler);
router.patch('/:id/status', updateInspectionStatusHandler);
router.patch(
  '/:id/review',
  requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]),
  reviewInspectionHandler
);

export default router;
