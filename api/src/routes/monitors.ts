import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { MonitorService } from '../services/monitor.service.js';
import { MonitorController } from '../controllers/monitor.controller.js';

const controller = new MonitorController(new MonitorService(prisma));

export const monitorsRouter = Router();
monitorsRouter.use(requireAuth);
monitorsRouter.get('/', controller.list);
monitorsRouter.post('/', controller.create);
monitorsRouter.get('/:id', controller.getById);
monitorsRouter.patch('/:id', controller.update);
monitorsRouter.delete('/:id', controller.delete);
