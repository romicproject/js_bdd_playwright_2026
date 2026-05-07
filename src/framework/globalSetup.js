// src/framework/globalSetup.js
// Runs once per Playwright run (before any worker starts).
// - Validates env-driven configuration (fail fast).
// - Performs the API preflight a single time when API lane is active
//   and exposes a shared flag to workers via process.env.

import { request as playwrightRequest } from "@playwright/test";
import { config, validateConfig } from "./config/envConfig.js";
import { joinUrl } from "./http/url.js";
import {
  isApiMockEnabled,
  markApiPreflightSatisfied,
  resolveConfigRequirements,
  shouldRunApiPreflight,
  API_PREFLIGHT_ENDPOINT,
} from "./http/preflightPolicy.js";
import {
  getEffectiveStatus,
  getResponseMessage,
} from "../support/api/response.assertions.js";

async function runApiPreflight() {
  const fullUrl = joinUrl(config.apiBaseUrl, API_PREFLIGHT_ENDPOINT);
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
      `[PREFLIGHT] API health check failed for ${fullUrl}. http=${response.status()} effective=${effectiveStatus} message="${getResponseMessage(preflightResult)}"`,
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
    `mock=${isApiMockEnabled()}`,
  ].join(" | ");
  console.log(summary);

  if (shouldRunApiPreflight(requireApi)) {
    const result = await runApiPreflight();
    console.log(
      `[globalSetup] API preflight OK (${result.effectiveStatus}) -> ${result.checkedUrl}`,
    );
    markApiPreflightSatisfied();
  } else {
    console.log("[globalSetup] API preflight skipped");
  }
}
