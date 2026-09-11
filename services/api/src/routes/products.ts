import { Router } from 'express';
import {
  createProductHandler,
  getProductByIdHandler,
  listProductsHandler,
} from '../controllers/product.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

router.use(requireAuth);

router.get('/', listProductsHandler);
router.get('/:id', getProductByIdHandler);
router.post(
  '/',
  requireRole([UserRole.SUPERVISOR, UserRole.ADMIN]),
  createProductHandler
);

export default router;
