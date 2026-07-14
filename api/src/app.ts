import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { monitorsRouter } from './routes/monitors.js';
import { AppError } from './lib/errors.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/auth', authRouter);
  app.use('/monitors', monitorsRouter);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error(JSON.stringify({ level: 'error', msg: 'unhandled error', err: String(err) }));
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
