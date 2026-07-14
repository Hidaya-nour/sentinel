import { config } from 'dotenv';
import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';

config({ path: '.env.test' });

// Truncate in FK-dependency order (children before parents) before every test,
// so each test starts from a known-empty state instead of leaking rows into
// the next test - this is what makes integration tests deterministic.
beforeEach(async () => {
  await prisma.incident.deleteMany();
  await prisma.check.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
