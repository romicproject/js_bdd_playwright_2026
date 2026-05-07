// src/framework/globalSetup.js
// Runs once per Playwright run (before any worker starts).
// - Validates env-driven configuration (fail fast).
// - Performs the API preflight a single time when API lane is active
//   and exposes a shared flag to workers via process.env.

import { config, validateConfig } from "./config/envConfig.js";
import {
  isApiMockEnabled,
  markApiPreflightSatisfied,
  resolveConfigRequirements,
  shouldRunApiPreflight,
  runApiPreflight,
} from "./http/preflightPolicy.js";

export default async function globalSetup() {
  const { requireApi, requireUi } = resolveConfigRequirements();

  // Fail fast if env is misconfigured for this lane.
  const validated = validateConfig({ requireApi, requireUi });

  const summary = [
    `[globalSetup] env=${validated.env}`,
    `lane=${process.env.TEST_LANE || "default"}`,
    `requireApi=${requireApi}`,
    `requireUi=${requireUi}`,
    `mock=${isApiMockEnabled()}`,
  ].join(" | ");
  console.log(summary);

  if (shouldRunApiPreflight(requireApi)) {
    const result = await runApiPreflight({
      apiBaseUrl: config.apiBaseUrl,
      requestTimeout: config.timeout?.request,
      apiKey: config.apiKey,
      ignoreHTTPSErrors: !config.isProduction,
    });
    console.log(
      `[globalSetup] API preflight OK (${result.effectiveStatus}) -> ${result.checkedUrl}`,
    );
    markApiPreflightSatisfied();
  } else {
    console.log("[globalSetup] API preflight skipped");
  }
}
