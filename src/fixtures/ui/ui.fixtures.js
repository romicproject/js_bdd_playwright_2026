// fixtures/ui/ui.fixtures.js
import { test as base } from "playwright-bdd";
import { config } from "../../framework/config/envConfig.js";
import { startTestLogging } from "../shared/testLogging.js";
import { applyNetworkBlocking } from "./helpers/networkBlocker.js";

import {
  ContactUsPage,
  HomePage,
  LoginPage,
  ProductsPage,
  RegisterPage,
} from "../../ui/pages/index.js";

export const test = base.extend({
  networkPolicy: [
    async ({ context }, use, testInfo) => {
      const allowedHosts = ["automationexercise.com"];

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
    const { logger, logFilePath, attachExecutionLog } = startTestLogging(
      testInfo,
      {
        kind: "UI",
      },
    );

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${config.baseUrl}`);

    await use({
      logger,
      logFilePath,
      state: {
        register: {},
      },
    });

    const duration = Date.now() - startTime;
    logger.info(`Completed in ${duration}ms | status=${testInfo.status}`);

    await attachExecutionLog();
  },

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
