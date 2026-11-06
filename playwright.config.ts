import { defineConfig, devices } from '@playwright/test';

// Default: dev servers started below. Set E2E_BASE_URL (e.g. https://localhost) to run the same
// suite against an already running stack such as `docker compose up`.
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  // The local Docker stack uses a self-signed certificate.
  use: { baseURL: externalBaseUrl ?? 'http://localhost:5173', ignoreHTTPSErrors: true },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          // Server only listens after MongoDB connects, so a healthy /api/health means the DB is up too.
          command: 'docker compose up -d --wait mongo && pnpm --filter @airsoft/server start',
          url: 'http://localhost:3000/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @airsoft/web dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
        },
      ],
});
