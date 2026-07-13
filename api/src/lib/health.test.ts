import { describe, it, expect } from 'vitest';
import { formatUptime } from './health.js';

describe('formatUptime', () => {
  it('formats whole minutes and seconds', () => {
    expect(formatUptime(125)).toBe('2m 5s');
  });

  it('handles zero', () => {
    expect(formatUptime(0)).toBe('0m 0s');
  });
});
