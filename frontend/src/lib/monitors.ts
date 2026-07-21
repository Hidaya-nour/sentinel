import { apiFetch } from './api';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  expectedStatus: number;
  isActive: boolean;
  createdAt: string;
}

export interface CheckRecord {
  id: string;
  statusCode: number | null;
  latencyMs: number | null;
  success: boolean;
  error: string | null;
  checkedAt: string;
}

export interface Incident {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  openedAt: string;
  resolvedAt: string | null;
}

export function listMonitors() {
  return apiFetch<Monitor[]>('/monitors');
}

export function getMonitor(id: string) {
  return apiFetch<Monitor>(`/monitors/${id}`);
}

export function createMonitor(input: { name: string; url: string; intervalSeconds?: number }) {
  return apiFetch<Monitor>('/monitors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteMonitor(id: string) {
  return apiFetch<void>(`/monitors/${id}`, { method: 'DELETE' });
}
export function getChecks(id: string) {
  return apiFetch<CheckRecord[]>(`/monitors/${id}/checks`);
}

export function getIncidents(id: string) {
  return apiFetch<Incident[]>(`/monitors/${id}/incidents`);
}
