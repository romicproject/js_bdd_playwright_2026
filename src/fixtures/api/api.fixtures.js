// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireApiConfig } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";
import { startTestLogging } from "../shared/testLogging.js";

async function cleanupTrackedUsers(apiContext, apiHelpers) {
  const logger = apiContext.getLogger();

  for (const user of [...apiContext.getCleanupUsers()].reverse()) {
    try {
      await apiHelpers.users.deleteAccount(
        {
          email: user.email,
          password: user.password,
        },
        { storeResponse: false },
      );

      logger?.info("Cleanup user deleted", {
        email: user.email,
      });
    } catch (error) {
      logger?.warn("Cleanup user delete failed", {
        email: user.email,
        error: String(error?.message || error),
      });
    } finally {
      apiContext.untrackCleanupUser(user.email);
    }
  }
}

export const test = base.extend({
  apiContext: async ({ request }, use, testInfo) => {
    const { apiBaseUrl } = requireApiConfig();
    const context = createApiContext(request, config);

    context.setScenarioStartTime(Date.now());
    context.setScenarioTimestamp(Date.now());

    // derive kind from project.name
    const projectName = testInfo.project?.name || "";
    const kind = /api/i.test(projectName) ? "API" : "UI";

    const { logger, logFilePath, attachExecutionLog } = startTestLogging(
      testInfo,
      { kind },
    );

    // expose logger/path on context
    context.setLogger(logger);
    context.setLogFilePath(logFilePath);

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

    const duration = Date.now() - context.getScenarioStartTime();
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

  cleanupTrackedUsers: [
    async ({ apiContext, apiHelpers }, use) => {
      await use();
      await cleanupTrackedUsers(apiContext, apiHelpers);
    },
    { auto: true },
  ],
});
