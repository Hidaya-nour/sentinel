import { test, expect } from '@playwright/test';
import { uniqueEmail, registerAndLogin } from './helpers';

test.describe('Monitor lifecycle', () => {
  test('a user can create a monitor and see it on the dashboard', async ({ page }) => {
    await registerAndLogin(page, uniqueEmail('monitor'));

    await page.getByPlaceholder('Name').fill('Example Site');
    await page.getByPlaceholder(/https:\/\//).fill('https://example.com');
    await page.getByRole('button', { name: /add monitor/i }).click();

    await expect(page.getByText('Example Site')).toBeVisible();
    await expect(page.getByText('https://example.com')).toBeVisible();
  });

  test('clicking a monitor navigates to its detail page', async ({ page }) => {
    await registerAndLogin(page, uniqueEmail('detail'));

    await page.getByPlaceholder('Name').fill('Detail Test Site');
    await page.getByPlaceholder(/https:\/\//).fill('https://example.com');
    await page.getByRole('button', { name: /add monitor/i }).click();
    await expect(page.getByText('Detail Test Site')).toBeVisible();

    await page.getByRole('link', { name: 'Detail Test Site' }).click();
    await expect(page).toHaveURL(/\/monitors\/.+/);
    await expect(page.getByRole('heading', { name: 'Detail Test Site' })).toBeVisible();
  });

  test('a user can delete a monitor and it disappears from the dashboard', async ({ page }) => {
    await registerAndLogin(page, uniqueEmail('delete'));

    await page.getByPlaceholder('Name').fill('Delete Me');
    await page.getByPlaceholder(/https:\/\//).fill('https://example.com');
    await page.getByRole('button', { name: /add monitor/i }).click();
    await expect(page.getByText('Delete Me')).toBeVisible();

    // Your Dashboard uses window.confirm() for delete - Playwright auto-dismisses
    // dialogs by default, so we explicitly accept it here.
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByText('Delete Me')).not.toBeVisible();
  });

  test("two different users cannot see each other's monitors", async ({ browser }) => {
    // Two isolated browser contexts = two genuinely separate sessions/cookies,
    // simulating two different real users rather than reusing one page.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, uniqueEmail('userA'));
    await pageA.getByPlaceholder('Name').fill('User A Only');
    await pageA.getByPlaceholder(/https:\/\//).fill('https://example.com');
    await pageA.getByRole('button', { name: /add monitor/i }).click();
    await expect(pageA.getByText('User A Only')).toBeVisible();

    await registerAndLogin(pageB, uniqueEmail('userB'));
    await expect(pageB.getByText('User A Only')).not.toBeVisible();
    await expect(pageB.getByText('No monitors yet')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
