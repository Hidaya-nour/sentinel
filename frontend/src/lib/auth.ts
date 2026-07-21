import { apiFetch } from './api';

export interface User {
  id: string;
  email: string;
}

export function register(email: string, password: string) {
  return apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export function me() {
  return apiFetch<{ user: User }>('/auth/me');
}
