import type { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import type { RegisterInput, LoginInput } from '../lib/validation.js';

// prisma is injected, not imported directly - this is what makes the service
// unit-testable: tests pass a mock/fake PrismaClient instead of hitting real Postgres.
export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Registration failed');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: { email: input.email, passwordHash },
      select: { id: true, email: true },
    });

    const token = signToken({ sub: user.id, email: user.email });
    return { token, user };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const hashToCheck =
      user?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const valid = await verifyPassword(hashToCheck, input.password);

    if (!user || !valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }
}
