import type { Request, Response, NextFunction } from 'express';
import { MonitorService } from '../services/monitor.service.js';
import { createMonitorSchema, updateMonitorSchema } from '../lib/validation.js';
import { scheduleMonitorChecks, unscheduleMonitorChecks } from '../lib/queue.js';

export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.monitorService.list(req.user!.sub));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const monitor = await this.monitorService.create(req.user!.sub, parsed.data);
      await scheduleMonitorChecks(monitor.id, monitor.intervalSeconds);
      res.status(201).json(monitor);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.monitorService.getById(req.user!.sub, req.params.id));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = updateMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const monitor = await this.monitorService.update(req.user!.sub, req.params.id, parsed.data);
      if (monitor.isActive) {
        await scheduleMonitorChecks(monitor.id, monitor.intervalSeconds);
      } else {
        await unscheduleMonitorChecks(monitor.id);
      }
      res.json(monitor);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.monitorService.delete(req.user!.sub, req.params.id);
      await unscheduleMonitorChecks(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  listChecks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.monitorService.listChecks(req.user!.sub, req.params.id));
    } catch (err) {
      next(err);
    }
  };

  listIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.monitorService.listIncidents(req.user!.sub, req.params.id));
    } catch (err) {
      next(err);
    }
  };
}
