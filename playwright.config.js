// playwright.config.js
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import { config as envConfig } from "./src/framework/config/envConfig.js";
import { buildAllureReporterOptions } from "./src/reporters/allureConfig.js";

const isCI = Boolean(process.env.CI);
const outputDir = "out/test-results";
const htmlReportDir = "out/playwright-report";
const allureResultsDir = "out/allure-results";

function formatRunId(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}-${mm}-${ss}-${ms}`;
}

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.trunc(parsed);
}

function resolveWorkers() {
  const configuredWorkers = parsePositiveInt(process.env.PLAYWRIGHT_WORKERS);
  if (configuredWorkers) {
    return configuredWorkers;
  }

  return isCI ? 3 : undefined;
}

function buildReporters() {
  const reporters = [
    ["list"],
    ["./src/reporters/configReporter.js"],
    ["./src/reporters/suiteMetricsReporter.js"],
    [
      "allure-playwright",
      buildAllureReporterOptions(envConfig, allureResultsDir),
    ],
    [
      "html",
      {
        open: "never",
        outputFolder: htmlReportDir,
      },
    ],
  ];

  if (isCI) {
    reporters.push(
      [
        "json",
        {
          outputFile: `${outputDir}/results.json`,
        },
      ],
      [
        "junit",
        {
          outputFile: `${outputDir}/junit.xml`,
        },
      ],
    );
  }

  return reporters;
}

if (!process.env.LOG_RUN_ID) {
  process.env.LOG_RUN_ID = formatRunId();
}

const testDir = defineBddConfig({
  features: [
    "tests/api/features/**/*.feature",
    "tests/ui/features/**/*.feature",
  ],
  steps: [
    "src/steps/api/**/*.steps.js",
    "src/steps/ui/**/*.steps.js",
    "src/fixtures/api/api.fixtures.js",
    "src/fixtures/ui/ui.fixtures.js",
  ],

  quotes: "double", // use "string" instead of 'string'
});

export default defineConfig({
  testDir,
  testMatch: "**/*.spec.js",

  globalSetup: "./src/framework/globalSetup.js",

  timeout: envConfig.timeout.global,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: envConfig.retry.retries,
  workers: resolveWorkers(),
  reporter: buildReporters(),

  //  Global test settings
  use: {
    ignoreHTTPSErrors: !envConfig.isProduction,
    trace: envConfig.isProduction ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: envConfig.timeout.request,
  },

  projects: [
    {
      name: "API Tests - Chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: envConfig.apiBaseUrl,
        trace: "off",
        video: "off",
        screenshot: "off",
        extraHTTPHeaders: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(envConfig.apiKey && { "X-API-Key": envConfig.apiKey }),
        },
      },
      testMatch: /api[\\/].*\.spec\.js/,
    },
    {
      name: "UI Tests - Chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: envConfig.baseUrl,
        trace: envConfig.isProduction ? "retain-on-failure" : "off",
        video: envConfig.isProduction ? "retain-on-failure" : "off",
        screenshot: "only-on-failure",
      },
      testMatch: /ui[\\/].*\.spec\.js/,
    },
  ],

  outputDir,
});
