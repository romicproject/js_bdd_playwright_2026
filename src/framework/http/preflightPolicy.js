import { parseBoolean } from "../env.js";

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
