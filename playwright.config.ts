import { defineConfig, devices } from "@playwright/test";
const browserPort = process.env.CASTALIA_BROWSER_PORT ?? "4173";
const browserOrigin = `http://127.0.0.1:${browserPort}`;
const browserExecutablePath = process.env.CASTALIA_BROWSER_EXECUTABLE_PATH;
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
    baseURL: browserOrigin,
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: `VITE_APP_ENV=test VITE_FIXTURE_MODE=true VITE_CASTALIA_CONTROL_BASE_URL=${browserOrigin} pnpm --filter @castalia/web build && pnpm --filter @castalia/web exec vite preview --host 127.0.0.1 --port ${browserPort} --strictPort`,
    url: browserOrigin,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: browserExecutablePath
          ? { executablePath: browserExecutablePath }
          : undefined,
      },
    },
  ],
});
