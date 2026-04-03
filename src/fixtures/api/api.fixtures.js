// fixtures/api/api.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireApiConfig } from "../../framework/config/envConfig.js";
import { createApiContext } from "./apiContext.js";
import { createApiClient } from "./apiClient.js";
import { createApiHelpers } from "./helpers/index.js";
import { startTestLogging } from "../shared/testLogging.js";
import { joinUrl } from "../../framework/http/url.js";
import {
  getEffectiveStatus,
  getResponseMessage,
} from "../../support/api/response.assertions.js";
import { buildScenarioUniqueId } from "../../support/api/users.data.js";
import { applyAllureMetadata } from "../../reporters/allureRuntime.js";

async function runApiPreflight(playwright) {
  const { apiBaseUrl } = requireApiConfig();
  const fullUrl = joinUrl(apiBaseUrl, "/productsList");
  const requestContext = await playwright.request.newContext({
    extraHTTPHeaders: {
      Accept: "application/json",
      ...(config.apiKey && { "X-API-Key": config.apiKey }),
    },
    ignoreHTTPSErrors: !config.isProduction,
  });

  try {
    const response = await requestContext.get(fullUrl, {
      timeout: config.timeout?.request,
    });

    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    const preflightResult = {
      status: response.status(),
      body,
    };
    const effectiveStatus = getEffectiveStatus(preflightResult);

    if (effectiveStatus >= 200 && effectiveStatus < 300) {
      return {
        ok: true,
        checkedUrl: fullUrl,
        effectiveStatus,
      };
    }

    throw new Error(
      `API preflight failed for ${fullUrl}. http=${response.status()} effective=${effectiveStatus} message="${getResponseMessage(preflightResult)}"`,
    );
  } finally {
    await requestContext.dispose();
  }
}

async function cleanupTrackedUsers(apiContext, apiHelpers) {
  const logger = apiContext.getLogger();
  const failures = [];

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
      const failure = {
        email: user.email,
        error: String(error?.message || error),
      };

      failures.push(failure);
      logger?.warn("Cleanup user delete failed", {
        email: failure.email,
        error: failure.error,
      });
    } finally {
      apiContext.untrackCleanupUser(user.email);
    }
  }

  if (failures.length > 0) {
    logger?.warn("Tracked user cleanup completed with failures", {
      count: failures.length,
      emails: failures.map((failure) => failure.email),
    });
  }

  return failures;
}

export const test = base.extend({
  apiAvailability: [
    async ({ playwright }, use) => {
      let resolvedPreflight = null;
      let preflightPromise = null;

      async function ensure() {
        if (resolvedPreflight) {
          return resolvedPreflight;
        }

        if (!preflightPromise) {
          preflightPromise = runApiPreflight(playwright).then((result) => {
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
          `Tracked user cleanup failed for ${failures.length} user(s): ${failures
            .map((failure) => `${failure.email} (${failure.error})`)
            .join("; ")}`,
        );
      }
    },
    { auto: true },
  ],
});
