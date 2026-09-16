import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3011",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3011",
    url: "http://127.0.0.1:3011",
    timeout: 120000,
    reuseExistingServer: false,
    env: { CAREEROPS_DATA_DIR: ".data/e2e", CAREEROPS_BUILD_DIR: ".next-e2e" },
  },
});
