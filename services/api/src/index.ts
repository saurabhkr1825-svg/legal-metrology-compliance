import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { requestIdMiddleware, errorHandler } from './middleware/response';
import healthRouter from './routes/health';

const app = express();

// ---------- Middleware ----------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(requestIdMiddleware);

// ---------- Routes ----------
app.use('/api/v1', healthRouter);

// ---------- Error handling ----------
app.use(errorHandler);

// ---------- Start ----------
app.listen(config.port, config.host, () => {
  console.log(`[SLM-API] Running on http://${config.host}:${config.port} (${config.env})`);
});

export default app;
