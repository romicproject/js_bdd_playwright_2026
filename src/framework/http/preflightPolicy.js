function parseBoolean(value) {
  return value === "true" || value === "1";
}

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

export function shouldSkipApiPreflight(requireApi) {
  if (!requireApi) return true;
  if (parseBoolean(process.env.API_MOCK_ENABLED)) return true;
  if (parseBoolean(process.env.API_SKIP_PREFLIGHT)) return true;
  return false;
}

export function shouldRunApiPreflight(requireApi) {
  return !shouldSkipApiPreflight(requireApi);
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
