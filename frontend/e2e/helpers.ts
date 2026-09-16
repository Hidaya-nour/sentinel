import type { Page } from '@playwright/test';

// Generates a unique email per test run so tests don't collide with each other
// or with leftover data from previous runs against the same database.
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function registerAndLogin(
  page: Page,
  email: string,
  password = 'correcthorsebattery',
) {
  await page.goto('/register');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder(/Password/).fill(password);
  await page.getByRole('button', { name: /register|create account/i }).click();
  await page.waitForURL('/dashboard');
}
