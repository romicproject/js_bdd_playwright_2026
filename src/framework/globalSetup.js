// src/framework/globalSetup.js
// Runs once per Playwright run (before any worker starts).
// - Validates env-driven configuration (fail fast).
// - Performs the API preflight a single time when API lane is active
//   and exposes a shared flag to workers via process.env.

import { request as playwrightRequest } from "@playwright/test";
import { config, validateConfig } from "./config/envConfig.js";
import { joinUrl } from "./http/url.js";
import {
  getEffectiveStatus,
  getResponseMessage,
} from "../support/api/response.assertions.js";

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

async function runApiPreflight() {
  const fullUrl = joinUrl(config.apiBaseUrl, "/productsList");
  const requestContext = await playwrightRequest.newContext({
    extraHTTPHeaders: {
      Accept: "application/json",
      ...(config.apiKey && { "X-API-Key": config.apiKey }),
    },
    ignoreHTTPSErrors: !config.isProduction,
  });

  try {
    const response = await requestContext.get(fullUrl, {
      timeout: config.timeout?.request,
    });

    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    const preflightResult = { status: response.status(), body };
    const effectiveStatus = getEffectiveStatus(preflightResult);

    if (effectiveStatus >= 200 && effectiveStatus < 300) {
      return { checkedUrl: fullUrl, effectiveStatus };
    }

    throw new Error(
      `API preflight failed for ${fullUrl}. http=${response.status()} effective=${effectiveStatus} message="${getResponseMessage(preflightResult)}"`,
    );
  } finally {
    await requestContext.dispose();
  }
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
    const result = await runApiPreflight();
    console.log(
      `[globalSetup] API preflight OK (${result.effectiveStatus}) -> ${result.checkedUrl}`,
    );
    // Mark preflight as done so the worker-scoped fixture can short-circuit.
    process.env.API_PREFLIGHT_OK = "1";
  } else {
    console.log("[globalSetup] API preflight skipped");
  }
}
