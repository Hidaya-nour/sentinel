const FAILURE_THRESHOLD = 3;

export interface RecentCheck {
  success: boolean;
}

// Pure function: given the last few checks (most recent first) and whether an
// incident is currently open, decide what should happen. No DB, no side effects -
// the worker's job handler is responsible for acting on this decision.
export type IncidentDecision = 'OPEN' | 'RESOLVE' | 'NONE';

export function decideIncidentAction(
  recentChecks: RecentCheck[],
  hasOpenIncident: boolean,
): IncidentDecision {
  const lastN = recentChecks.slice(0, FAILURE_THRESHOLD);
  const allFailed = lastN.length === FAILURE_THRESHOLD && lastN.every((c) => !c.success);

  if (allFailed && !hasOpenIncident) {
    return 'OPEN';
  }
  if (recentChecks[0]?.success && hasOpenIncident) {
    return 'RESOLVE';
  }
  return 'NONE';
}
