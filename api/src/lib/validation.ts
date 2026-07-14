import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  // NOTE: this only validates URL shape, not safety. It does not block
  // private/internal IP ranges (127.0.0.1, 169.254.169.254 cloud metadata, etc).
  // Real SSRF protection belongs in the worker's fetch logic (Phase 10), checked
  // at request time since DNS can rebind after this validation runs anyway.
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must use http or https',
    }),
  intervalSeconds: z.number().int().min(30).max(86400).default(60),
  expectedStatus: z.number().int().min(100).max(599).default(200),
});

export const updateMonitorSchema = createMonitorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
