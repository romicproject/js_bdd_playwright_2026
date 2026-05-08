function safeUrlHost(value) {
  if (!value) return "n/a";

  try {
    return new URL(String(value)).host;
  } catch {
    return String(value);
  }
}

function buildAllureEnvironmentInfo(config) {
  return {
    ENV: config.env,
    TEST_LANE: config.retry?.lane || "default",
    RETRIES: String(config.retry?.retries ?? 0),
    CI: process.env.CI ? "true" : "false",
    LOG_RUN_ID: process.env.LOG_RUN_ID || "n/a",
    BASE_URL_HOST: safeUrlHost(config.baseUrl),
    API_BASE_URL_HOST: safeUrlHost(config.apiBaseUrl),
    API_MOCK_ENABLED: String(Boolean(config.apiMock?.enabled)),
    API_MOCK_PROFILE: config.apiMock?.profile || "none",
    LOG_ATTACH_ALLURE: process.env.LOG_ATTACH_ALLURE || "true",
  };
}

function buildAllureCategories() {
  return [
    {
      name: "Cleanup / teardown",
      messageRegex:
        "cleanup failed|Tracked user cleanup failed|UI tracked-user cleanup failed|cleanup skipped",
      matchedStatuses: ["failed", "broken"],
    },
    {
      name: "UI navigation / timeout",
      messageRegex:
        "Navigation timeout|Timeout .* exceeded|waitForURL|waitForLoadState|Page .* not ready",
      matchedStatuses: ["failed", "broken"],
    },
    {
      name: "External site restrictions",
      messageRegex: "forbidden|403|Access denied|google_vignette",
      matchedStatuses: ["failed", "broken"],
    },
    {
      name: "API request / contract failure",
      messageRegex:
        "API request failed|API FAIL|Unexpected status|Schema validation failed|Expected response",
      matchedStatuses: ["failed", "broken"],
    },
  ];
}

export function buildAllureReporterOptions(config, resultsDir) {
  return {
    resultsDir,
    detail: true,
    suiteTitle: true,
    environmentInfo: buildAllureEnvironmentInfo(config),
    categories: buildAllureCategories(),
  };
}
