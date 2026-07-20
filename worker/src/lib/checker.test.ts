import { describe, it, expect } from 'vitest';
import { performCheck } from './checker.js';

describe('performCheck', () => {
  it('reports success when status matches expected', async () => {
    const result = await performCheck('https://example.com', 200);
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('reports failure when status does not match expected', async () => {
    const result = await performCheck('https://example.com', 404);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Expected status 404');
  });

  it('reports failure with an error message for an unreachable host', async () => {
    const result = await performCheck(
      'https://this-domain-does-not-exist-sentinel-test.invalid',
      200,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('captures TLS cert expiry for an https URL', async () => {
    const result = await performCheck('https://example.com', 200);
    expect(result.tlsExpiresAt).toBeInstanceOf(Date);
  });
});
