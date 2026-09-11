import request from 'supertest';
import express from 'express';
import healthRouter from '../src/routes/health';
import { requestIdMiddleware } from '../src/middleware/response';
import * as db from '../src/db';

describe('Health & Readiness Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(requestIdMiddleware);
    app.use('/api/v1', healthRouter);
    app.use('/', healthRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /health (Liveness)', () => {
    it('should return 200 with service information', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBe('slm-api');
      expect(res.body.data.version).toBe('0.1.0');
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.metadata).toBeDefined();
    });

    it('should work under /api/v1/health prefix', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('GET /health/ready (Readiness)', () => {
    it('should return 200 when database is healthy', async () => {
      jest.spyOn(db, 'healthCheck').mockResolvedValue(true);

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.checks.database).toBe('healthy');
    });

    it('should return 503 when database is unhealthy', async () => {
      jest.spyOn(db, 'healthCheck').mockResolvedValue(false);

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(res.body.error.message).toBe('Database connection failed');
    });
  });
});
