import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.figma.spec.ts',
  globalSetup: './e2e/visual-global-setup.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never', outputFolder: 'playwright-visual-report' }]],
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4175',
    browserName: 'chromium',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    locale: 'en-US',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'figma-desktop',
      use: { viewport: { width: 1440, height: 1077 } },
    },
    {
      name: 'figma-mobile',
      use: { viewport: { width: 390, height: 1252 } },
    },
  ],
})
