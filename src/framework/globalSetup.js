// src/framework/globalSetup.js
// Runs once per Playwright run (before any worker starts).
// - Validates env-driven configuration (fail fast).
// - Performs the API preflight a single time when API lane is active
//   and exposes a shared flag to workers via process.env.

import { request as playwrightRequest } from "@playwright/test";
import { config, validateConfig } from "./config/envConfig.js";
import { runApiPreflight } from "./http/apiPreflight.js";

function parseBoolean(value) {
  return value === "true" || value === "1";
}

/**
 * Decide which configuration keys are mandatory for this run.
 * Heuristics:
 *  - TEST_LANE starting with "ui-"   -> UI required, API optional
 *  - TEST_LANE starting with "api-"  -> API required, UI optional
 *  - otherwise                       -> both required (default test run)
 *
 * `API_MOCK_ENABLED=true` always skips live API preflight (below).
 */
function resolveConfigRequirements() {
  const lane = String(process.env.TEST_LANE || "")
    .trim()
    .toLowerCase();

  if (lane.startsWith("ui-")) {
    return { requireApi: false, requireUi: true };
  }

  if (lane.startsWith("api-")) {
    return { requireApi: true, requireUi: false };
  }

  return { requireApi: true, requireUi: true };
}

function shouldRunApiPreflight(requireApi) {
  if (!requireApi) return false;
  if (parseBoolean(process.env.API_MOCK_ENABLED)) return false;
  if (parseBoolean(process.env.API_SKIP_PREFLIGHT)) return false;
  return true;
}

export default async function globalSetup() {
  const { requireApi, requireUi } = resolveConfigRequirements();

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

  if (shouldRunApiPreflight(requireApi)) {
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
