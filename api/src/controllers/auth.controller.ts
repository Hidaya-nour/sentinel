import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../lib/validation.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = await this.authService.register(parsed.data);
      res.status(201).json(result);
    } catch (err) {
      next(err); // caught by the central error handler in index.ts
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = await this.authService.login(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
