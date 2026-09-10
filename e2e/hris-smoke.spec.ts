import { expect, test } from '@playwright/test';

test.describe('HRIS protected surfaces', () => {
  test('operations workspace is a valid application route', async ({ page }) => {
    const response = await page.goto('/people/operations');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('engagement workspace is a valid application route', async ({ page }) => {
    const response = await page.goto('/workforce/engagement');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('career explorer is a valid Learning route', async ({ page }) => {
    const response = await page.goto('/learning/career-explorer');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('trusted certificates is a valid Learning route', async ({ page }) => {
    const response = await page.goto('/learning/trusted-certificates');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('achievements is a valid dedicated Learning route', async ({ page }) => {
    const response = await page.goto('/learning/achievements');

    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('HR API requires an authenticated session', async ({ request }) => {
    const response = await request.get('/api/hr/v1/assignments?pageSize=1');

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });

  test('headcount bulk actions require an authenticated session', async ({ request }) => {
    const response = await request.post('/api/hiring/headcount-requests/bulk-action', {
      data: {
        ids: ['00000000-0000-0000-0000-000000000000'],
        action: 'approve',
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ message: 'Unauthorized' });
  });

  test('payroll preview requires an authenticated session', async ({ request }) => {
    const response = await request.post('/api/payroll/v1/calculate-preview', {
      data: {
        employeeId: '00000000-0000-0000-0000-000000000000',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        baseSalary: 50_000,
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });
});
