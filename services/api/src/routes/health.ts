import { Router, Request, Response } from 'express';
import { sendSuccess } from '../middleware/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'slm-api',
    version: '0.1.0',
    uptime: process.uptime(),
  });
});

export default router;
