// fixtures/ui/ui.fixtures.js
import { test as base } from "playwright-bdd";
import { config, requireUiConfig } from "../../framework/config/envConfig.js";
import { startTestLogging } from "../shared/testLogging.js";
import { applyNetworkBlocking } from "./helpers/networkBlocker.js";
import { createApiContext } from "../api/apiContext.js";
import { createApiClient } from "../api/apiClient.js";
import { createApiHelpers } from "../api/helpers/index.js";
import { getEffectiveStatus } from "../../support/api/response.assertions.js";

import {
  ContactUsPage,
  HomePage,
  LoginPage,
  ProductsPage,
  RegisterPage,
} from "../../ui/pages/index.js";

function createUiContext({ logger, logFilePath, testInfo }) {
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
      cleanup: {
        users: [],
      },
    },
    getCleanupUsers() {
      return this.state.cleanup.users;
    },
    trackCleanupUser(user) {
      if (!user?.email || !user?.password) return;

      const alreadyTracked = this.getCleanupUsers().some(
        (entry) =>
          entry.email === user.email && entry.password === user.password,
      );

      if (!alreadyTracked) {
        this.getCleanupUsers().push({
          email: user.email,
          password: user.password,
        });
      }
    },
    untrackCleanupUser(email) {
      if (!email) return;
      this.state.cleanup.users = this.getCleanupUsers().filter(
        (entry) => entry.email !== email,
      );
    },
  };
}

async function cleanupTrackedUiUsers(uiContext, request, testInfo) {
  if (uiContext.getCleanupUsers().length === 0) {
    return [];
  }

  if (!config.apiBaseUrl) {
    uiContext.logger?.warn(
      "UI cleanup skipped because API_BASE_URL is missing",
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
        uiContext.logger?.info("UI cleanup user deleted", {
          email: user.email,
        });
      } else if (effectiveStatus === 404) {
        uiContext.logger?.info("UI cleanup user already absent", {
          email: user.email,
        });
      } else {
        failures.push({
          email: user.email,
          error: `effectiveStatus=${effectiveStatus}`,
        });
        uiContext.logger?.warn("UI cleanup user delete returned non-success", {
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
      uiContext.logger?.warn("UI cleanup user delete failed", failure);
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
    const { logger, logFilePath, attachExecutionLog } = startTestLogging(
      testInfo,
      {
        kind: "UI",
      },
    );

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${baseUrl}`);

    const uiContext = createUiContext({
      logger,
      logFilePath,
      testInfo,
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
          `UI tracked-user cleanup failed for ${failures.length} user(s): ${failures
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
