import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitorService } from './monitor.service.js';
import { NotFoundError } from '../lib/errors.js';

function makeMockPrisma() {
  return {
    monitor: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as any;
}

describe('MonitorService', () => {
  let prisma: ReturnType<typeof makeMockPrisma>;
  let service: MonitorService;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new MonitorService(prisma);
  });

  it('getById throws NotFoundError when no matching row for that user', async () => {
    prisma.monitor.findFirst.mockResolvedValue(null);

    await expect(service.getById('user-1', 'monitor-1')).rejects.toThrow(NotFoundError);

    // Confirms the ownership filter is actually being passed to Prisma, not just
    // fetched by id and checked in application code (which would be a different,
    // weaker guarantee).
    expect(prisma.monitor.findFirst).toHaveBeenCalledWith({
      where: { id: 'monitor-1', userId: 'user-1' },
    });
  });

  it('update throws NotFoundError when updateMany affects 0 rows (wrong owner or missing id)', async () => {
    prisma.monitor.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.update('user-1', 'monitor-1', { name: 'new name' })).rejects.toThrow(
      NotFoundError,
    );

    expect(prisma.monitor.findUnique).not.toHaveBeenCalled();
  });

  it('delete throws NotFoundError when deleteMany affects 0 rows', async () => {
    prisma.monitor.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.delete('user-1', 'monitor-1')).rejects.toThrow(NotFoundError);
  });

  it('delete succeeds silently when a row was actually removed', async () => {
    prisma.monitor.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.delete('user-1', 'monitor-1')).resolves.toBeUndefined();
  });
});
