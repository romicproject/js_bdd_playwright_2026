// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireApiConfig } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";
import { createCommonContext } from "../shared/contextFactory.js";
import {
  isApiPreflightSatisfied,
  resolveConfigRequirements,
  runApiPreflight,
} from "../../framework/http/preflightPolicy.js";
import { executeTrackedUserCleanup } from "../../support/api/cleanupExecutor.js";
import { applyAllureMetadata } from "../../reporters/allureRuntime.js";

async function cleanupTrackedUsers(apiContext, apiHelpers) {
  return executeTrackedUserCleanup({
    users: apiContext.getCleanupUsers(),
    logger: apiContext.getLogger(),
    prefix: "[API_CLEANUP]",
    deleteUser: (user) =>
      apiHelpers.users.deleteAccount(
        {
          email: user.email,
          password: user.password,
        },
        { storeResponse: false },
      ),
    untrackUser: (email) => apiContext.untrackCleanupUser(email),
  });
}

export const test = base.extend({
  apiAvailability: [
    async ({ playwright }, use) => {
      let resolvedPreflight = null;
      let preflightPromise = null;
      const { requireApi } = resolveConfigRequirements();

      async function ensure() {
        if (resolvedPreflight) {
          return resolvedPreflight;
        }

        // globalSetup already ran a successful preflight for this run.
        if (isApiPreflightSatisfied()) {
          resolvedPreflight = { ok: true, source: "globalSetup" };
          return resolvedPreflight;
        }

        if (!requireApi) {
          resolvedPreflight = { ok: true, source: "skip-policy" };
          return resolvedPreflight;
        }

        if (!preflightPromise) {
          preflightPromise = runApiPreflight({
            apiBaseUrl: requireApiConfig().apiBaseUrl,
            requestTimeout: config.timeout?.request,
            apiKey: config.apiKey,
            ignoreHTTPSErrors: !config.isProduction,
          }).then((result) => {
            resolvedPreflight = { ok: true, ...result };
            return resolvedPreflight;
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

    // Use shared factory to create common context structure
    const commonContext = createCommonContext({
      testInfo,
      kind: "API",
    });

    // Create API-specific context
    const context = createApiContext(request, config);
    context.setScenarioStartTime(commonContext.scenarioTimestamp);
    context.setScenarioTimestamp(commonContext.scenarioTimestamp);
    context.setScenarioUniqueId(commonContext.scenarioUniqueId);
    context.setLogger(commonContext.logger);
    context.setLogFilePath(commonContext.logFilePath);

    const { logger } = commonContext;
    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${apiBaseUrl}`);
    logger.debug(`API mock enabled: ${context.mock.enabled}`);
    logger.debug(`API mock profile: ${context.mock.profile || "none"}`);


    await applyAllureMetadata(testInfo, {
      kind: commonContext.kind,
      feature: commonContext.feature,
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

    await commonContext.attachExecutionLog();
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
      const failures = await cleanupTrackedUsers(apiContext, apiHelpers);

      if (failures.length === 0) {
        return;
      }

      testInfo.annotations.push({
        type: "cleanup",
        description: `failed=${failures.length}; users=${failures.map((failure) => failure.email).join(",")}`,
      });

      if (config.apiCleanup.failOnError) {
        throw new Error(
          `[API_CLEANUP] Tracked user cleanup failed for ${failures.length} user(s): ${failures
            .map((failure) => `${failure.email} (${failure.error})`)
            .join("; ")}`,
        );
      }
    },
    { auto: true },
  ],
});
