import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { requestIdMiddleware, errorHandler } from './middleware/response';
import { runMigrations } from './db/migrate';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import inspectionsRouter from './routes/inspections';
import productsRouter from './routes/products';
import rulesRouter from './routes/rules';
import auditRouter from './routes/audit';
import usersRouter from './routes/users';

const app = express();

// ---------- Middleware ----------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(requestIdMiddleware);

// ---------- Root Health Probes ----------
app.use(healthRouter);

// ---------- API v1 Routes ----------
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/inspections', inspectionsRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/rules', rulesRouter);
app.use('/api/v1/audit-logs', auditRouter);
app.use('/api/v1/users', usersRouter);

// ---------- Error handling ----------
app.use(errorHandler);

// ---------- Start ----------
async function start() {
  try {
    console.log('[APP] Running database migrations...');
    await runMigrations();
    console.log('[APP] Migrations completed successfully.');

    app.listen(config.port, config.host, () => {
      console.log(`[SLM-API] Running on http://${config.host}:${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error('[APP] Failed to start application:', err);
    process.exit(1);
  }
}

start();

export default app;
