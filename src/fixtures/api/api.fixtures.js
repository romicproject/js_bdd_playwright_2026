// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireApiConfig } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";
import { startTestLogging } from "../shared/testLogging.js";

export const test = base.extend({
  apiContext: async ({ request }, use, testInfo) => {
    const { apiBaseUrl } = requireApiConfig();
    const context = createApiContext(request, config);

    context.startTime = Date.now();
    context.scenarioName = testInfo.title;
    context.scenarioTimestamp = Date.now();

    // derive kind from project.name
    const projectName = testInfo.project?.name || "";
    const kind = /api/i.test(projectName) ? "API" : "UI";

    const { logger, logFilePath, attachExecutionLog } = startTestLogging(
      testInfo,
      { kind },
    );

    // expose logger/path on context
    context.logger = logger;
    context.logFilePath = logFilePath;

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${apiBaseUrl}`);
    logger.debug(`API mock enabled: ${context.mock.enabled}`);
    logger.debug(`API mock profile: ${context.mock.profile || "none"}`);

    await use(context);

    testInfo.annotations.push({
      type: "api-mock",
      description: `enabled=${context.mock.enabled} profile=${context.mock.profile || "none"}`,
    });

    const duration = Date.now() - context.startTime;
    logger.info(`Completed in ${duration}ms | status=${testInfo.status}`);

    await attachExecutionLog();
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
