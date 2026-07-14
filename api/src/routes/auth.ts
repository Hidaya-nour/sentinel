import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const controller = new AuthController(new AuthService(prisma));

export const authRouter = Router();
authRouter.post('/register', authLimiter, controller.register);
authRouter.post('/login', authLimiter, controller.login);
