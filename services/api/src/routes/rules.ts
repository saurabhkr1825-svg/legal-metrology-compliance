import { Router } from 'express';
import {
  createRuleHandler,
  getRuleByIdAndVersionHandler,
  listRulesHandler,
} from '../controllers/rule.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@slm/shared';

const router = Router();

router.use(requireAuth);

router.get('/', listRulesHandler);
router.get('/:ruleId/:version', getRuleByIdAndVersionHandler);
router.post(
  '/',
  requireRole([UserRole.ADMIN]),
  createRuleHandler
);

export default router;
