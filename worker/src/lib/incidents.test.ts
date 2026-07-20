import { describe, it, expect } from 'vitest';
import { decideIncidentAction } from './incidents.js';

describe('decideIncidentAction', () => {
  it('does nothing with fewer than 3 checks total', () => {
    const checks = [{ success: false }, { success: false }];
    expect(decideIncidentAction(checks, false)).toBe('NONE');
  });

  it('does nothing if failures are not consecutive from the most recent check', () => {
    const checks = [{ success: true }, { success: false }, { success: false }];
    expect(decideIncidentAction(checks, false)).toBe('NONE');
  });

  it('opens an incident after exactly 3 consecutive failures', () => {
    const checks = [{ success: false }, { success: false }, { success: false }];
    expect(decideIncidentAction(checks, false)).toBe('OPEN');
  });

  it('does not re-open an incident that is already open', () => {
    const checks = [{ success: false }, { success: false }, { success: false }];
    expect(decideIncidentAction(checks, true)).toBe('NONE');
  });

  it('resolves an open incident on the first successful check', () => {
    const checks = [{ success: true }, { success: false }, { success: false }];
    expect(decideIncidentAction(checks, true)).toBe('RESOLVE');
  });

  it('does nothing if there is no open incident and the check succeeded', () => {
    const checks = [{ success: true }];
    expect(decideIncidentAction(checks, false)).toBe('NONE');
  });
});
