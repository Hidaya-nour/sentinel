import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

const { AuthService } = await import('./auth.service.js');
const { ConflictError, UnauthorizedError } = await import('../lib/errors.js');

// A fake Prisma client - just the methods AuthService actually calls, as vi.fn()
// stubs we control per-test. This is what makes the test run in milliseconds
// with zero real database involved: we're testing AuthService's logic, not Postgres.
function makeMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  } as any;
}

describe('AuthService.register', () => {
  let prisma: ReturnType<typeof makeMockPrisma>;
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new AuthService(prisma);
  });

  it('throws ConflictError if the email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });

    await expect(
      service.register({ email: 'a@b.com', password: 'correcthorsebattery' }),
    ).rejects.toThrow(ConflictError);

    // create should never be reached once we've already found a duplicate
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a user and returns a token when email is free', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'new-id', email: 'new@b.com' });

    const result = await service.register({ email: 'new@b.com', password: 'correcthorsebattery' });

    expect(result.user).toEqual({ id: 'new-id', email: 'new@b.com' });
    expect(typeof result.token).toBe('string');
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });
});

describe('AuthService.login', () => {
  let prisma: ReturnType<typeof makeMockPrisma>;
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new AuthService(prisma);
  });

  it('throws UnauthorizedError when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ghost@b.com', password: 'whatever12345' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the password is wrong', async () => {
    const { hashPassword } = await import('../lib/auth.js');
    const passwordHash = await hashPassword('correcthorsebattery');
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash });

    await expect(service.login({ email: 'a@b.com', password: 'wrongpassword' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('returns a token on correct credentials', async () => {
    const { hashPassword } = await import('../lib/auth.js');
    const passwordHash = await hashPassword('correcthorsebattery');
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash });

    const result = await service.login({ email: 'a@b.com', password: 'correcthorsebattery' });

    expect(result.user).toEqual({ id: '1', email: 'a@b.com' });
    expect(typeof result.token).toBe('string');
  });
});
