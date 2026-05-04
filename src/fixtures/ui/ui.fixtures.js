// fixtures/ui/ui.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireUiConfig } from "../../framework/config/envConfig.js";
import { startTestLogging } from "../shared/testLogging.js";
import { applyNetworkBlocking } from "./helpers/networkBlocker.js";
import { createApiContext } from "../api/apiContext.js";
import { createApiClient } from "../api/apiClient.js";
import { createApiHelpers } from "../api/helpers/index.js";
import { getEffectiveStatus } from "../../support/api/response.assertions.js";
import { UserCleanupRegistry } from "../../support/shared/cleanupTracking.js";

import {
  ContactUsPage,
  HomePage,
  LoginPage,
  ProductsPage,
  RegisterPage,
} from "../../ui/pages/index.js";
import { applyAllureMetadata } from "../../reporters/allureRuntime.js";

function createUiContext({ logger, logFilePath, testInfo, cleanupRegistry }) {
  return {
    logger,
    logFilePath,
    testIdentity: {
      runId: process.env.LOG_RUN_ID,
      workerIndex: testInfo.workerIndex,
      parallelIndex: testInfo.parallelIndex,
      retry: testInfo.retry,
    },
    state: {
      register: {},
    },
    getCleanupUsers() {
      return cleanupRegistry.getAll();
    },
    trackCleanupUser(user) {
      if (!user?.email || !user?.password) return;
      cleanupRegistry.track(user.email, user.password, "ui");
      this.logger?.debug("[UI] User cleanup tracked", { email: user.email });
    },
    untrackCleanupUser(email) {
      cleanupRegistry.untrack(email, "ui");
      this.logger?.debug("[UI] User cleanup untracked", { email });
    },
    _getCleanupRegistry() {
      return cleanupRegistry;
    },
  };
}

async function cleanupTrackedUiUsers(uiContext, request, testInfo) {
  if (uiContext.getCleanupUsers().length === 0) {
    return [];
  }

  if (!config.apiBaseUrl) {
    uiContext.logger?.warn(
      "[UI_CLEANUP] Skipped: API_BASE_URL is missing",
    );
    return uiContext.getCleanupUsers().map((user) => ({
      email: user.email,
      error: "API_BASE_URL is missing",
    }));
  }

  const cleanupContext = createApiContext(request, config);
  cleanupContext.setLogger(uiContext.logger);
  const cleanupClient = createApiClient(cleanupContext, testInfo);
  const apiHelpers = createApiHelpers(cleanupClient);
  const failures = [];

  for (const user of [...uiContext.getCleanupUsers()].reverse()) {
    try {
      const response = await apiHelpers.users.deleteAccount(
        {
          email: user.email,
          password: user.password,
        },
        { storeResponse: false },
      );
      const effectiveStatus = getEffectiveStatus(response);

      if (effectiveStatus >= 200 && effectiveStatus < 300) {
        uiContext.logger?.info("[UI_CLEANUP] User deleted", {
          email: user.email,
        });
      } else if (effectiveStatus === 404) {
        uiContext.logger?.info("[UI_CLEANUP] User already absent", {
          email: user.email,
        });
      } else {
        failures.push({
          email: user.email,
          error: `effectiveStatus=${effectiveStatus}`,
        });
        uiContext.logger?.warn("[UI_CLEANUP] Delete returned non-success", {
          email: user.email,
          effectiveStatus,
        });
      }
    } catch (error) {
      const failure = {
        email: user.email,
        error: String(error?.message || error),
      };

      failures.push(failure);
      uiContext.logger?.warn("[UI_CLEANUP] Delete failed", failure);
    } finally {
      uiContext.untrackCleanupUser(user.email);

      if (uiContext.state.register.user?.email === user.email) {
        uiContext.state.register.meta = {
          ...(uiContext.state.register.meta || {}),
          cleanupPending: false,
        };
      }
    }
  }

  return failures;
}

export const test = base.extend({
  networkPolicy: [
    async ({ context }, use, testInfo) => {
      const { baseUrl } = requireUiConfig();
      const allowedHosts = [];

      try {
        allowedHosts.push(new URL(baseUrl).hostname);
      } catch {}

      const net = await applyNetworkBlocking(context, {
        allowedHosts,
      });

      testInfo.annotations.push({
        type: "network",
        description: `NETWORK_POLICY ads=${net.enabled} resources=${net.blockResources} allowedHosts=${allowedHosts.join(",")}`,
      });

      await use(context);
    },
    { auto: true },
  ],

  uiContext: async ({}, use, testInfo) => {
    const startTime = Date.now();
    const { baseUrl } = requireUiConfig();
    const { logger, logFilePath, attachExecutionLog, feature } =
      startTestLogging(testInfo, {
        kind: "UI",
      });

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${baseUrl}`);

    await applyAllureMetadata(testInfo, {
      kind: "UI",
      feature,
    });

    const cleanupRegistry = new UserCleanupRegistry(logger);
    const uiContext = createUiContext({
      logger,
      logFilePath,
      testInfo,
      cleanupRegistry,
    });

    await use(uiContext);

    const duration = Date.now() - startTime;
    logger.info(`Completed in ${duration}ms | status=${testInfo.status}`);

    await attachExecutionLog();
  },

  cleanupTrackedUiUsers: [
    async ({ request, uiContext }, use, testInfo) => {
      await use();
      const failures = await cleanupTrackedUiUsers(
        uiContext,
        request,
        testInfo,
      );

      if (failures.length === 0) {
        return;
      }

      testInfo.annotations.push({
        type: "cleanup",
        description: `ui-failed=${failures.length}; users=${failures.map((failure) => failure.email).join(",")}`,
      });

      if (config.apiCleanup.failOnError) {
        throw new Error(
          `[UI_CLEANUP] Tracked-user cleanup failed for ${failures.length} user(s): ${failures
            .map((failure) => `${failure.email} (${failure.error})`)
            .join("; ")}`,
        );
      }
    },
    { auto: true },
  ],

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  contactUsPage: async ({ page }, use) => {
    await use(new ContactUsPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
});
