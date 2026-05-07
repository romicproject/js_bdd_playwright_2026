// src/fixtures/shared/contextFactory.js
// Centralized factory for creating common context structure
// Used by both API and UI fixtures to reduce duplication

import { startTestLogging } from "./testLogging.js";
import { buildScenarioUniqueId } from "../../support/api/users.data.js";
import { UserCleanupRegistry } from "../../support/shared/cleanupTracking.js";

/**
 * Creates common context properties for both API and UI tests
 * @param {Object} options - Configuration options
 * @param {Object} options.testInfo - Playwright testInfo object
 * @param {string} options.kind - Test kind ("API" or "UI")
 * @param {Object} options.runIdOverride - Optional custom run ID for userId generation
 * @returns {Object} Common context object with logger, metadata, and cleanup registry
 */
export function createCommonContext({
  testInfo,
  kind,
  runIdOverride = undefined,
}) {
  const { logger, logFilePath, attachExecutionLog, feature } = startTestLogging(
    testInfo,
    { kind },
  );

  const scenarioTimestamp = Date.now();
  const runId = runIdOverride || process.env.LOG_RUN_ID;

  return {
    // Logging infrastructure
    logger,
    logFilePath,
    attachExecutionLog,
    feature,

    // Test metadata
    testInfo,
    kind,
    scenarioTimestamp,
    scenarioUniqueId: buildScenarioUniqueId({
      runId,
      workerIndex: testInfo.workerIndex,
      parallelIndex: testInfo.parallelIndex,
      retry: testInfo.retry,
      timestamp: scenarioTimestamp,
    }),

    // User cleanup tracking
    cleanupRegistry: new UserCleanupRegistry(logger),
  };
}
