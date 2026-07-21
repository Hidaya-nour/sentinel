import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../lib/validation.js';

const COOKIE_OPTIONS = {
  httpOnly: true, // JS on the page cannot read this cookie - defeats token theft via XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod; allow http for local dev
  sameSite: 'lax' as const, // sent on same-site navigation and top-level GETs, blocked cross-site POSTs - meaningful CSRF mitigation for state-changing requests
  maxAge: 60 * 60 * 1000, // 1h, matches JWT_EXPIRY in lib/auth.ts - keep these in sync
};

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
      res.cookie('token', result.token, COOKIE_OPTIONS);
      res.status(201).json({ user: result.user });
    } catch (err) {
      next(err);
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
      res.cookie('token', result.token, COOKIE_OPTIONS);
      res.status(200).json({ user: result.user });
    } catch (err) {
      next(err);
    }
  };

  logout = (_req: Request, res: Response) => {
    res.clearCookie('token', COOKIE_OPTIONS);
    res.status(204).send();
  };

  me = (req: Request, res: Response) => {
    // requireAuth middleware already ran and populated req.user before this handler.
    res.json({ user: req.user });
  };
}
