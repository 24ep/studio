import { expect, test } from '@playwright/test';

const learningRoutes = [
  '/learning',
  '/learning/courses',
  '/learning/paths',
  '/learning/certificates',
  '/learning/manage',
  '/learning/manage/reviews',
  '/learning/manage/reports',
];

test.describe('Learning production boundaries', () => {
  for (const route of learningRoutes) {
    test(`${route} is directly addressable`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('Learning onboarding compatibility route is healthy', async ({ page }) => {
    const response = await page.goto('/learning/onboarding');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  for (const endpoint of ['/api/learning/me', '/api/learning/catalog', '/api/learning/manage']) {
    test(`${endpoint} requires authentication`, async ({ request }) => {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    });
  }

  test('atomic assignment endpoint requires authentication', async ({ request }) => {
    const response = await request.post('/api/learning/assignments', {
      data: {
        employeeId: '11111111-1111-4111-8111-111111111111',
        courseIds: ['22222222-2222-4222-8222-222222222222'],
        sourceType: 'course',
        sourceId: '22222222-2222-4222-8222-222222222222',
        sourceLabel: 'Course',
        idempotencyKey: 'browser-smoke-learning-assignment',
      },
    });
    expect(response.status()).toBe(401);
  });
});
