import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3010/',
    trace: 'on-first-retry',
    actionTimeout: 5000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'npm run test:server:bg',
    port: 3010,
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI
  }
});
