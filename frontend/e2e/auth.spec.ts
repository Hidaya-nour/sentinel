import { test, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Authentication', () => {
  test('a new user can register and lands on the dashboard', async ({ page }) => {
    const email = uniqueEmail('register');
    await page.goto('/register');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder(/Password/).fill('correcthorsebattery');
    await page.getByRole('button', { name: /register|create account/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(email)).toBeVisible();
  });

  test('a registered user can log out and log back in', async ({ page }) => {
    const email = uniqueEmail('login');
    await page.goto('/register');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder(/Password/).fill('correcthorsebattery');
    await page.getByRole('button', { name: /register|create account/i }).click();
    await expect(page).toHaveURL('/dashboard');

    await page.getByRole('button', { name: /log ?out/i }).click();
    await expect(page).toHaveURL('/login');

    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder(/Password/).fill('correcthorsebattery');
    await page.getByRole('button', { name: /log ?in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('an unauthenticated user is redirected away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('wrong password shows an error and does not navigate', async ({ page }) => {
    const email = uniqueEmail('wrongpw');
    // register first so the account exists
    await page.goto('/register');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder(/Password/).fill('correcthorsebattery');
    await page.getByRole('button', { name: /register|create account/i }).click();
    await expect(page).toHaveURL('/dashboard');

    await page.getByRole('button', { name: /log ?out/i }).click();
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder(/Password/).fill('wrongpassword');
    await page.getByRole('button', { name: /log ?in/i }).click();

    await expect(page).toHaveURL('/login'); // should NOT navigate away
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
