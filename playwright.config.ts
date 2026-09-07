import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 8021);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const ciChromeChannel = process.env.CI ? 'chrome' : undefined;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // CI uses the system Chrome shipped on GitHub-hosted runners. Disabling
    // Playwright video there avoids its separate FFmpeg binary dependency while
    // retaining traces and screenshots for failure diagnostics.
    video: process.env.CI ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // GitHub-hosted Ubuntu runners already ship Chrome. Use that system
      // browser in CI so the production gate does not depend on downloading a
      // separate Playwright Chromium binary before every run.
      use: { ...devices['Desktop Chrome'], channel: ciChromeChannel },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Do not route browser tests through `npm run dev`: the local developer
        // script historically used PowerShell and made Linux CI unable to start.
        command: `npx next dev -p ${port} --turbo`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
