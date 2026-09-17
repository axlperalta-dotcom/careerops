import { defineConfig } from "@playwright/test";
import { mkdirSync, mkdtempSync } from "node:fs";
import path from "node:path";

mkdirSync(".data", { recursive: true });
const dataDir = mkdtempSync(path.resolve(".data", "portfolio-"));

export default defineConfig({
  testDir: ".",
  testMatch: "portfolio.capture.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3012",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "npm run dev -- --port 3012",
    url: "http://127.0.0.1:3012",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      CAREEROPS_DATA_DIR: dataDir,
      CAREEROPS_BUILD_DIR: ".next-portfolio",
    },
  },
});
