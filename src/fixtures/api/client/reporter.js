function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function toBool(v, fallback) {
  if (v == null) return fallback;
  return String(v).toLowerCase() === 'true';
}

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function getLogLevelName() {
  const fromEnv = String(env('LOG_LEVEL', 'info')).toLowerCase();
  if (LEVELS[fromEnv] != null) return fromEnv;

  // Optional aliases
  if (toBool(env('VERBOSE_LOGGING', null), false) || toBool(env('DEBUG_MODE', null), false)) {
    return 'debug';
  }

  return 'info';
}

export function getAttachAllureEnabled() {
  // Same flag used by api.fixtures.js to attach execution.log
  return toBool(env('LOG_ATTACH_ALLURE', 'true'), true);
}

/**
 * Controls whether API client emits request/response flow logs.
 * Source of truth: LOG_LEVEL (+ optional VERBOSE_LOGGING/DEBUG_MODE aliases)
 */
export function shouldLog() {
  // log request/response flow only when debug
  return getLogLevelName() === 'debug';
}

export function getLogger(apiContext) {
  if (apiContext?.logger) return apiContext.logger;

  return {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error
  };
}

/**
 * Fallback strategy:
 * - If LOG_ATTACH_ALLURE=true: fixture attaches execution.log -> SKIP JSON to avoid duplication.
 * - If LOG_ATTACH_ALLURE=false: NO execution.log -> ATTACH JSON on fail/exception for diagnostics.
 */
export async function attachJson(testInfo, name, obj) {
  if (!testInfo) return;

  if (getAttachAllureEnabled()) return;

  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(obj, null, 2), 'utf8'),
    contentType: 'application/json'
  });
}