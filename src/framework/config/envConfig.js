import dotenv from "dotenv";
import path from "path";
import fs from "node:fs";

// Determine environment (default: dev)
const ENV = process.env.ENV || "dev";

// Validate environment
const validEnvironments = ["dev", "staging", "prod"];
if (!validEnvironments.includes(ENV)) {
  throw new Error(
    `[CONFIG] Invalid environment: ${ENV}. Must be one of: ${validEnvironments.join(", ")}`,
  );
}

// Load the corresponding .env file from repository env/ when present.
// If the local file is missing, rely on already-injected process.env values
// so CI and container-based runs can provide secrets without a checked-in file.
const envPath = path.resolve(process.cwd(), `env/${ENV}.env`);
const hasEnvFile = fs.existsSync(envPath);
const result = hasEnvFile
  ? dotenv.config({ path: envPath, quiet: true })
  : { parsed: {} };

if (hasEnvFile && result.error) {
  throw new Error(
    `[CONFIG] Failed to load environment config from ${envPath}: ${result.error.message}`,
  );
}

/**
 * Parse integer from string, with fallback
 */
function parseIntSafe(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

/**
 * Parse boolean from string
 */
function parseBoolean(value) {
  return value === "true" || value === "1";
}

function resolveRetryCount() {
  const lane = String(process.env.TEST_LANE || "")
    .trim()
    .toLowerCase();
  const defaultRetries = parseIntSafe(process.env.RETRY_FAILED_TESTS, 0);

  switch (lane) {
    case "api-mock":
      return parseIntSafe(process.env.RETRY_API_MOCK, 0);
    case "api-live-smoke":
    case "api-live-regression":
      return parseIntSafe(process.env.RETRY_API_LIVE, defaultRetries);
    case "ui-critical":
      return parseIntSafe(process.env.RETRY_UI_CRITICAL, 1);
    case "ui-regression":
      return parseIntSafe(process.env.RETRY_UI_REGRESSION, 1);
    default:
      return defaultRetries;
  }
}

/**
 * Environment configuration
 */
export const config = {
  // Environment info
  env: ENV,
  isProduction: ENV === "prod",
  isDevelopment: ENV === "dev",
  isStaging: ENV === "staging",

  // URLs
  baseUrl: process.env.BASE_URL,
  apiBaseUrl: process.env.API_BASE_URL,

  // Timeouts
  timeout: {
    request: parseIntSafe(process.env.REQUEST_TIMEOUT, 10000),
    global: parseIntSafe(process.env.GLOBAL_TIMEOUT, 30000),
  },

  // Test user (for scenarios that require an existing user)
  testUser: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
  },

  // API Keys
  apiKey: process.env.API_KEY,

  // API mock mode (opt-in)
  apiMock: {
    enabled: parseBoolean(process.env.API_MOCK_ENABLED),
    profile: process.env.API_MOCK_PROFILE || "",
  },

  // API cleanup policy
  apiCleanup: {
    failOnError: parseBoolean(process.env.API_FAIL_ON_CLEANUP_ERROR),
  },

  // Retry settings
  retry: {
    lane: process.env.TEST_LANE || "default",
    retries: resolveRetryCount(),
  },

  // Debug settings
  debug: {
    enabled: parseBoolean(process.env.DEBUG_MODE),
    verboseLogging: parseBoolean(process.env.VERBOSE_LOGGING),
  },
};

function requireValue(envName, value) {
  if (value !== undefined && value !== null && value !== "") {
    return value;
  }

  throw new Error(
    `[CONFIG] ${envName} is required in environment configuration`,
  );
}

export function requireApiConfig() {
  return {
    apiBaseUrl: requireValue("API_BASE_URL", config.apiBaseUrl),
  };
}

export function requireUiConfig() {
  return {
    baseUrl: requireValue("BASE_URL", config.baseUrl),
  };
}

// Export for validation in tests
export function validateConfig(options = {}) {
  const { requireApi = true, requireUi = true } = options;
  const required = [
    ["timeout.request", config.timeout?.request],
    ["timeout.global", config.timeout?.global],
  ];

  if (requireApi) {
    required.push(["apiBaseUrl", config.apiBaseUrl]);
  }

  if (requireUi) {
    required.push(["baseUrl", config.baseUrl]);
  }

  const missing = required
    .filter(
      ([, value]) => value === undefined || value === null || value === "",
    )
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(", ")}`);
  }

  return {
    valid: true,
    env: config.env,
    envFileLoaded: hasEnvFile,
  };
}
