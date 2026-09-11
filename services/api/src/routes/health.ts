import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../middleware/response';
import { healthCheck } from '../db';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'slm-api',
    version: '0.1.0',
    uptime: process.uptime(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  const dbHealthy = await healthCheck();

  if (!dbHealthy) {
    sendError(res, 'SERVICE_UNAVAILABLE', 'Database connection failed', 503, {
      database: 'unhealthy',
    });
    return;
  }

  sendSuccess(res, {
    status: 'ready',
    checks: {
      database: 'healthy',
    },
  });
});

export default router;
