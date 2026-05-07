import { parseBoolean } from "../env.js";
import { joinUrl } from "./url.js";
import { request as playwrightRequest } from "@playwright/test";
import {
  getEffectiveStatus,
  getResponseMessage,
} from "../../support/api/response.assertions.js";

// Preflight health check endpoint (consistent across globalSetup and api.fixtures)
export const API_PREFLIGHT_ENDPOINT = "/productsList";

export function resolveConfigRequirements() {
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

export function shouldRunApiPreflight(requireApi) {
  if (!requireApi) return false;
  if (parseBoolean(process.env.API_MOCK_ENABLED)) return false;
  if (parseBoolean(process.env.API_SKIP_PREFLIGHT)) return false;
  return true;
}

export function isApiPreflightSatisfied() {
  return process.env.API_PREFLIGHT_OK === "1";
}

export function markApiPreflightSatisfied() {
  process.env.API_PREFLIGHT_OK = "1";
}

export function isApiMockEnabled() {
  return parseBoolean(process.env.API_MOCK_ENABLED);
}

/**
 * Run API preflight health check via Playwright request context.
 * Shared function used by both globalSetup and api.fixtures.
 * Extracted to avoid code duplication.
 *
 * @param {object} options - Configuration
 * @param {string} options.apiBaseUrl - Base API URL
 * @param {number} [options.requestTimeout] - Request timeout in ms
 * @param {string} [options.apiKey] - API key if needed
 * @param {boolean} [options.ignoreHTTPSErrors] - Whether to ignore HTTPS errors
 * @returns {Promise<{checkedUrl: string, effectiveStatus: number}>}
 * @throws Error if preflight health check fails
 */
export async function runApiPreflight({
  apiBaseUrl,
  requestTimeout = 10000,
  apiKey = null,
  ignoreHTTPSErrors = false,
} = {}) {
  const fullUrl = joinUrl(apiBaseUrl, API_PREFLIGHT_ENDPOINT);
  const requestContext = await playwrightRequest.newContext({
    extraHTTPHeaders: {
      Accept: "application/json",
      ...(apiKey && { "X-API-Key": apiKey }),
    },
    ignoreHTTPSErrors,
  });

  try {
    const response = await requestContext.get(fullUrl, {
      timeout: requestTimeout,
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
