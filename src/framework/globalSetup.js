// src/framework/globalSetup.js
// Runs once per Playwright run (before any worker starts).
// - Validates env-driven configuration (fail fast).
// - Performs the API preflight a single time when API lane is active
//   and exposes a shared flag to workers via process.env.

import { request as playwrightRequest } from "@playwright/test";
import { config, validateConfig } from "./config/envConfig.js";
import { runApiPreflight } from "./http/apiPreflight.js";
import {
  resolveConfigRequirements,
  shouldRunLiveApiPreflight,
} from "./http/preflightPolicy.js";

function parseBoolean(value) {
  return value === "true" || value === "1";
}

export default async function globalSetup() {
  const lane = process.env.TEST_LANE || "";
  const { requireApi, requireUi } = resolveConfigRequirements(lane);

  // Fail fast if env is misconfigured for this lane.
  const validated = validateConfig({ requireApi, requireUi });

  const summary = [
    `[globalSetup] env=${validated.env}`,
    `lane=${process.env.TEST_LANE || "default"}`,
    `requireApi=${requireApi}`,
    `requireUi=${requireUi}`,
    `mock=${parseBoolean(process.env.API_MOCK_ENABLED)}`,
  ].join(" | ");
  console.log(summary);

  if (
    shouldRunLiveApiPreflight({
      requireApi,
      testLane: lane,
      apiMockEnabled: process.env.API_MOCK_ENABLED,
      apiSkipPreflight: process.env.API_SKIP_PREFLIGHT,
    })
  ) {
    const result = await runApiPreflight({
      requestFactory: playwrightRequest,
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout?.request,
      ignoreHTTPSErrors: !config.isProduction,
    });
    console.log(
      `[globalSetup] API preflight OK (${result.effectiveStatus}) -> ${result.checkedUrl}`,
    );
    // Mark preflight as done so the worker-scoped fixture can short-circuit.
    process.env.API_PREFLIGHT_OK = "1";
  } else {
    console.log("[globalSetup] API preflight skipped");
  }
}
