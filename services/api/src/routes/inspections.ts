import { Router } from 'express';
import { createInspectionHandler, getInspectionByIdHandler, listInspectionsHandler } from '../controllers/inspection.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

// All inspection routes require authentication
router.post('/', requireAuth, createInspectionHandler);
router.get('/', requireAuth, listInspectionsHandler);
router.get('/:id', requireAuth, getInspectionByIdHandler);

export default router;
