import { describe, it, expect } from 'vitest';

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

const { hashPassword, verifyPassword, signToken, verifyToken } = await import('./auth.js');

describe('password hashing', () => {
  it('produces a hash different from the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('mypassword123');
    expect(await verifyPassword(hash, 'mypassword123')).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('mypassword123');
    expect(await verifyPassword(hash, 'wrongpassword')).toBe(false);
  });

  it('rejects a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-real-hash', 'anything')).toBe(false);
  });
});

describe('JWT', () => {
  it('round-trips a valid token', () => {
    const token = signToken({ sub: 'user-123', email: 'a@b.com' });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('a@b.com');
  });

  it('throws on a tampered token', () => {
    const token = signToken({ sub: 'user-123', email: 'a@b.com' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });
});
