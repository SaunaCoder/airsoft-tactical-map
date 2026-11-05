import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  // ponytail: web only; add the server (and MongoDB) here once the first e2e flow needs sockets.
  webServer: {
    command: 'pnpm --filter @airsoft/web dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
