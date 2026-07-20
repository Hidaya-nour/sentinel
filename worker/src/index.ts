import 'dotenv/config';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from './lib/prisma.js';
import { performCheck } from './lib/checker.js';
import { decideIncidentAction } from './lib/incidents.js';

interface CheckJobData {
  monitorId: string;
}

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker<CheckJobData>(
  'monitor-checks',
  async (job) => {
    const monitor = await prisma.monitor.findUnique({ where: { id: job.data.monitorId } });
    if (!monitor || !monitor.isActive) {
      return; // monitor was deleted/paused after the job was scheduled - skip silently
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
      // Webhook alerting hooks in here - Phase 3 stretch, or fold into Phase 9.
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
