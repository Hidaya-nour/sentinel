import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../lib/errors.js';
import type { CreateMonitorInput, UpdateMonitorInput } from '../lib/validation.js';

export class MonitorService {
  constructor(private prisma: PrismaClient) {}

  list(userId: string) {
    return this.prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, input: CreateMonitorInput) {
    return this.prisma.monitor.create({ data: { ...input, userId } });
  }

  async getById(userId: string, id: string) {
    const monitor = await this.prisma.monitor.findFirst({ where: { id, userId } });
    if (!monitor) throw new NotFoundError('Monitor not found');
    return monitor;
  }

  async update(userId: string, id: string, input: UpdateMonitorInput) {
    // updateMany + count confirms ownership atomically - avoids a find-then-update
    // race between checking ownership and writing (TOCTOU).
    const result = await this.prisma.monitor.updateMany({
      where: { id, userId },
      data: input,
    });
    if (result.count === 0) throw new NotFoundError('Monitor not found');
    return this.prisma.monitor.findUnique({ where: { id } });
  }

  async delete(userId: string, id: string) {
    const result = await this.prisma.monitor.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new NotFoundError('Monitor not found');
  }
}
