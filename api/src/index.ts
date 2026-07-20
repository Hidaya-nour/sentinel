import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { scheduleMonitorChecks } from './lib/queue.js';

const PORT = process.env.PORT ?? 4000;
const app = createApp();

async function start() {
  // Repeatable BullMQ jobs live in Redis rather than Postgres. Recreate them at
  // startup so monitors that existed before an API/Redis restart are checked too.
  const monitors = await prisma.monitor.findMany({
    where: { isActive: true },
    select: { id: true, intervalSeconds: true },
  });
  await Promise.all(
    monitors.map((monitor) => scheduleMonitorChecks(monitor.id, monitor.intervalSeconds)),
  );

  app.listen(PORT, () => {
    console.log(
      JSON.stringify({
        level: 'info',
        msg: `api listening on ${PORT}`,
        scheduledMonitors: monitors.length,
      }),
    );
  });
}

start().catch((err: unknown) => {
  console.error(JSON.stringify({ level: 'error', msg: 'API startup failed', err: String(err) }));
  process.exitCode = 1;
});
