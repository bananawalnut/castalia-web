import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR,
  reporter: [
    ["line"],
    [
      "html",
      { outputFolder: process.env.PLAYWRIGHT_REPORT_DIR, open: "never" },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command:
      "NODE_ENV=development VITE_APP_ENV=test VITE_FIXTURE_MODE=true pnpm --filter @castalia/web exec vite --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
