import type { Request, Response, NextFunction } from 'express';
import { MonitorService } from '../services/monitor.service.js';
import { createMonitorSchema, updateMonitorSchema } from '../lib/validation.js';

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
      res.status(201).json(await this.monitorService.create(req.user!.sub, parsed.data));
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
      res.json(await this.monitorService.update(req.user!.sub, req.params.id, parsed.data));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.monitorService.delete(req.user!.sub, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
