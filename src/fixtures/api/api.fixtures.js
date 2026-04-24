// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireApiConfig } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";
import { startTestLogging } from "../shared/testLogging.js";
import { buildScenarioUniqueId } from "../../support/api/users.data.js";
import { applyAllureMetadata } from "../../reporters/allureRuntime.js";
import { runApiPreflight } from "../../framework/http/apiPreflight.js";
import { cleanupTrackedUsers } from "../../support/api/cleanupUsers.js";

export const test = base.extend({
  apiAvailability: [
    async ({ playwright }, use) => {
      let resolvedPreflight = null;
      let preflightPromise = null;

      async function ensure() {
        if (resolvedPreflight) {
          return resolvedPreflight;
        }

        // globalSetup already ran a successful preflight for this run.
        if (process.env.API_PREFLIGHT_OK === "1") {
          resolvedPreflight = { ok: true, source: "globalSetup" };
          return resolvedPreflight;
        }

        if (!preflightPromise) {
          const { apiBaseUrl } = requireApiConfig();
          preflightPromise = runApiPreflight({
            requestFactory: playwright.request,
            apiBaseUrl,
            apiKey: config.apiKey,
            timeout: config.timeout?.request,
            ignoreHTTPSErrors: !config.isProduction,
          }).then((result) => {
            resolvedPreflight = result;
            return result;
          });
        }

        return preflightPromise;
      }

      await use({ ensure });
    },
    { scope: "worker" },
  ],

  apiContext: async ({ request }, use, testInfo) => {
    const { apiBaseUrl } = requireApiConfig();
    const context = createApiContext(request, config);
    const scenarioTimestamp = Date.now();

    context.setScenarioStartTime(scenarioTimestamp);
    context.setScenarioTimestamp(scenarioTimestamp);
    context.setScenarioUniqueId(
      buildScenarioUniqueId({
        runId: process.env.LOG_RUN_ID,
        workerIndex: testInfo.workerIndex,
        parallelIndex: testInfo.parallelIndex,
        retry: testInfo.retry,
        timestamp: scenarioTimestamp,
      }),
    );

    // derive kind from project.name
    const projectName = testInfo.project?.name || "";
    const kind = /api/i.test(projectName) ? "API" : "UI";

    const { logger, logFilePath, attachExecutionLog, feature } =
      startTestLogging(testInfo, { kind });

    // expose logger/path on context
    context.setLogger(logger);
    context.setLogFilePath(logFilePath);

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${apiBaseUrl}`);
    logger.debug(`API mock enabled: ${context.mock.enabled}`);
    logger.debug(`API mock profile: ${context.mock.profile || "none"}`);

    await applyAllureMetadata(testInfo, {
      kind,
      feature,
      apiMockEnabled: context.mock.enabled,
      apiMockProfile: context.mock.profile || "none",
    });

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
    async ({ apiContext, apiHelpers }, use, testInfo) => {
      await use();
      const failures = await cleanupTrackedUsers({
        users: apiContext.getCleanupUsers(),
        deleteUser: (user) =>
          apiHelpers.users.deleteAccount(
            {
              email: user.email,
              password: user.password,
            },
            { storeResponse: false },
          ),
        untrackUser: (email) => apiContext.untrackCleanupUser(email),
        logger: apiContext.getLogger(),
      });

      if (failures.length === 0) {
        return;
      }

      testInfo.annotations.push({
        type: "cleanup",
        description: `failed=${failures.length}; users=${failures.map((failure) => failure.email).join(",")}`,
      });

      if (config.apiCleanup.failOnError) {
        throw new Error(
          `Tracked user cleanup failed for ${failures.length} user(s): ${failures
            .map((failure) => `${failure.email} (${failure.error})`)
            .join("; ")}`,
        );
      }
    },
    { auto: true },
  ],
});
