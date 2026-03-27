// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";

import {
  createLogger,
  getAttachAllureEnabled,
} from "../../framework/logging/logger.js";
import {
  buildTestLogPath,
  inferFeatureFromTestInfo,
} from "../../logging/paths.js";

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

export const test = base.extend({
  apiContext: async ({ request }, use, testInfo) => {
    const context = createApiContext(request, config);

    context.startTime = Date.now();
    context.scenarioName = testInfo.title;
    context.scenarioTimestamp = Date.now();

    // derive kind from project.name
    const projectName = testInfo.project?.name || "";
    const kind = /api/i.test(projectName) ? "API" : "UI";

    // derive feature from the playwright-bdd generated spec (stable)
    const feature = inferFeatureFromTestInfo(testInfo);

    const baseDir = String(env("LOG_DIR", "logs"));
    const logFilePath = buildTestLogPath({
      baseDir,
      kind,
      feature,
      testTitle: testInfo.title,
    });

    const logger = createLogger({
      filePath: logFilePath,
      testId: testInfo.testId,
    });

    // expose logger/path on context
    context.logger = logger;
    context.logFilePath = logFilePath;

    testInfo.annotations.push({
      type: "feature",
      description: feature,
    });
    testInfo.annotations.push({
      type: "log-file",
      description: logFilePath,
    });
    testInfo.annotations.push({
      type: "project",
      description: projectName || "unknown",
    });

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${config.apiBaseUrl}`);
    logger.debug(`API mock enabled: ${context.mock.enabled}`);
    logger.debug(`API mock profile: ${context.mock.profile || "none"}`);

    await use(context);

    testInfo.annotations.push({
      type: "api-mock",
      description: `enabled=${context.mock.enabled} profile=${context.mock.profile || "none"}`,
    });

    const duration = Date.now() - context.startTime;
    logger.info(`Completed in ${duration}ms | status=${testInfo.status}`);

    if (getAttachAllureEnabled()) {
      await testInfo.attach("execution.log", {
        path: logFilePath,
        contentType: "text/plain",
      });
    }
  },

  apiClient: async ({ apiContext }, use, testInfo) => {
    const client = createApiClient(apiContext, testInfo);
    await use(client);
  },

  apiHelpers: async ({ apiClient }, use) => {
    const helpers = createApiHelpers(apiClient);
    await use(helpers);
  },
});
