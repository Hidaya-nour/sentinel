import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ for blocking connections
});

export interface CheckJobData {
  monitorId: string;
}

export const checkQueue = new Queue<CheckJobData>('monitor-checks', { connection });

// Replace the monitor's prior repeat key before adding a new schedule. BullMQ's
// repeat key includes the interval, so a stable jobId alone does not replace a
// schedule whose interval changed.
export async function scheduleMonitorChecks(monitorId: string, intervalSeconds: number) {
  await unscheduleMonitorChecks(monitorId);
  await checkQueue.add(
    'check',
    { monitorId },
    {
      repeat: { every: intervalSeconds * 1000 },
      jobId: `monitor-${monitorId}`,
    },
  );
}

export async function unscheduleMonitorChecks(monitorId: string) {
  const repeatableJobs = await checkQueue.getRepeatableJobs();
  const match = repeatableJobs.find((job) => job.id === `monitor-${monitorId}`);
  if (match) {
    await checkQueue.removeRepeatableByKey(match.key);
  }
}
