import 'dotenv/config';
import express from 'express';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from './lib/prisma.js';
import { performCheck } from './lib/checker.js';
import { decideIncidentAction } from './lib/incidents.js';

// Keep the worker's job payload type local so its TypeScript project does not
// include source files from the API project outside its rootDir.
type CheckJobData = {
  monitorId: string;
};

// Render's free tier requires a "Web Service" that binds to a port and responds
// to HTTP - it has no free tier for a pure background process. This tiny server
// exists only to satisfy that requirement; it does not affect job processing,
// which still happens entirely through the BullMQ worker below.
const app = express();
const PORT = process.env.PORT ?? 4001;
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', msg: `worker health server listening on ${PORT}` }));
});

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker<CheckJobData>(
  'monitor-checks',
  async (job) => {
    const monitor = await prisma.monitor.findUnique({ where: { id: job.data.monitorId } });
    if (!monitor || !monitor.isActive) {
      return;
    }

    const result = await performCheck(monitor.url, monitor.expectedStatus);

    await prisma.check.create({
      data: {
        monitorId: monitor.id,
        success: result.success,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        tlsExpiresAt: result.tlsExpiresAt,
        error: result.error,
      },
    });

    const recentChecks = await prisma.check.findMany({
      where: { monitorId: monitor.id },
      orderBy: { checkedAt: 'desc' },
      take: 3,
      select: { success: true },
    });

    const openIncident = await prisma.incident.findFirst({
      where: { monitorId: monitor.id, status: 'OPEN' },
    });

    const action = decideIncidentAction(recentChecks, !!openIncident);

    if (action === 'OPEN') {
      await prisma.incident.create({ data: { monitorId: monitor.id, status: 'OPEN' } });
      console.log(JSON.stringify({ level: 'warn', msg: 'incident opened', monitorId: monitor.id }));
    } else if (action === 'RESOLVE' && openIncident) {
      await prisma.incident.update({
        where: { id: openIncident.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
      console.log(
        JSON.stringify({ level: 'info', msg: 'incident resolved', monitorId: monitor.id }),
      );
    }
  },
  { connection, concurrency: 5 },
);

worker.on('failed', (job, err) => {
  console.error(
    JSON.stringify({ level: 'error', msg: 'job failed', jobId: job?.id, err: err.message }),
  );
});

console.log(JSON.stringify({ level: 'info', msg: 'worker started, listening for jobs' }));
