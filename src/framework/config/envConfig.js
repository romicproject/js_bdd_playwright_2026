import dotenv from 'dotenv';
import path from 'path';

// Determine environment (default: dev)
const ENV = process.env.ENV || 'dev';

// Validate environment
const validEnvironments = ['dev', 'staging', 'prod'];
if (!validEnvironments.includes(ENV)) {
  throw new Error(
    `Invalid environment: ${ENV}. Must be one of: ${validEnvironments.join(', ')}`
  );
}

// Load the corresponding .env file from repository env/
const envPath = path.resolve(process.cwd(), `env/${ENV}.env`);
const result = dotenv.config({ path: envPath, quiet: true });

if (result.error) {
  throw new Error(
    `Failed to load environment config from ${envPath}: ${result.error.message}`
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
  return value === 'true' || value === '1';
}

/**
 * Environment configuration
 */
export const config = {
  // Environment info
  env: ENV,
  isProduction: ENV === 'prod',
  isDevelopment: ENV === 'dev',
  isStaging: ENV === 'staging',

  // URLs
  baseUrl: process.env.BASE_URL,
  apiBaseUrl: process.env.API_BASE_URL,

  // Timeouts
  timeout: {
    request: parseIntSafe(process.env.REQUEST_TIMEOUT, 10000),
    global: parseIntSafe(process.env.GLOBAL_TIMEOUT, 30000)
  },

  // Test user (for scenarios that require an existing user)
  testUser: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  },

  // API Keys
  apiKey: process.env.API_KEY,

  // Retry settings
  retry: {
    retries: parseIntSafe(process.env.RETRY_FAILED_TESTS, 0),
    maxRetries: parseIntSafe(process.env.MAX_RETRIES, 2)
  },

  // Debug settings
  debug: {
    enabled: parseBoolean(process.env.DEBUG_MODE),
    verboseLogging: parseBoolean(process.env.VERBOSE_LOGGING)
  }
};

// Validate critical configuration
if (!config.apiBaseUrl) {
  throw new Error('API_BASE_URL is required in environment configuration');
}

// Export for validation in tests
export function validateConfig() {
  const required = [
    ['apiBaseUrl', config.apiBaseUrl],
    ['timeout.request', config.timeout?.request],
    ['timeout.global', config.timeout?.global]
  ];
  const missing = required
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }

  return {
    valid: true,
    env: config.env
  };
}
