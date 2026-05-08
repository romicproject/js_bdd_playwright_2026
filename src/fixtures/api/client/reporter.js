import {
  isDebugLoggingEnabled,
  getAttachAllureEnabled,
} from "../../../framework/logging/logger.js";

/**
 * Controls whether API client emits request/response flow logs.
 * Source of truth: LOG_LEVEL (+ optional VERBOSE_LOGGING/DEBUG_MODE aliases)
 */
export const shouldLog = isDebugLoggingEnabled;

export function getLogger(apiContext) {
  if (typeof apiContext?.getLogger === "function") {
    const logger = apiContext.getLogger();
    if (logger) return logger;
  }

  if (apiContext?.logger) return apiContext.logger;

  return {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error,
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

  const payload = {
    metadata: {
      title: testInfo.title,
      testId: testInfo.testId,
      project: testInfo.project?.name || "unknown",
      file: testInfo.file || testInfo.location?.file || "unknown",
    },
    details: obj,
  };

  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2), "utf8"),
    contentType: "application/json",
  });
}
