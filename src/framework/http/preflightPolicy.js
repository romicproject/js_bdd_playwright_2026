function parseBoolean(value) {
  return value === "true" || value === "1";
}

function readLane(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function resolveConfigRequirements(testLane) {
  const lane = readLane(testLane);

  if (lane.startsWith("ui-")) {
    return { requireApi: false, requireUi: true };
  }

  if (lane.startsWith("api-")) {
    return { requireApi: true, requireUi: false };
  }

  return { requireApi: true, requireUi: true };
}

export function shouldSkipLiveApiPreflight({
  testLane,
  apiMockEnabled,
  apiSkipPreflight,
}) {
  const lane = readLane(testLane);

  if (lane.startsWith("ui-")) return true;
  if (parseBoolean(apiMockEnabled)) return true;
  if (parseBoolean(apiSkipPreflight)) return true;

  return false;
}

export function shouldRunLiveApiPreflight({
  requireApi,
  testLane,
  apiMockEnabled,
  apiSkipPreflight,
}) {
  if (!requireApi) return false;

  return !shouldSkipLiveApiPreflight({
    testLane,
    apiMockEnabled,
    apiSkipPreflight,
  });
}
