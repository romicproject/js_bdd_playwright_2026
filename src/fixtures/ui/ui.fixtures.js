// fixtures/ui/ui.fixtures.js
import { test as base } from 'playwright-bdd';
import { config } from '../../framework/config/envConfig.js';
import { createLogger, getAttachAllureEnabled } from '../../framework/logging/logger.js';
import { buildTestLogPath, inferFeatureFromTestInfo } from '../../logging/paths.js';

import { applyNetworkBlocking } from './helpers/networkBlocker.js';

import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ContactUsPage } from './pages/ContactUsPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

export const test = base.extend({
  context: async ({ browser }, use, testInfo) => {
    const allowedHosts = ['automationexercise.com'];

    const context = await browser.newContext({
      baseURL: config.baseUrl,
      ignoreHTTPSErrors: true,
    });

    const net = await applyNetworkBlocking(context, {
      allowedHosts,
    });

    testInfo.annotations.push({
      type: 'network',
      description: `NETWORK_POLICY ads=${net.enabled} resources=${net.blockResources} allowedHosts=${allowedHosts.join(',')}`,
    });

    await use(context);
    await context.close();
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  uiContext: async ({ }, use, testInfo) => {
    const startTime = Date.now();
    const feature = inferFeatureFromTestInfo(testInfo);
    const baseDir = env('LOG_DIR', 'logs');
    const logFilePath = buildTestLogPath({
      baseDir,
      kind: 'UI',
      feature,
      testTitle: testInfo.title,
    });

    const logger = createLogger({ filePath: logFilePath, testId: testInfo.testId });

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

    if (getAttachAllureEnabled()) {
      await testInfo.attach('execution.log', {
        path: logFilePath,
        contentType: 'text/plain',
      });
    }
  },

  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  contactUsPage: async ({ page }, use) => { await use(new ContactUsPage(page)); },
  productsPage: async ({ page }, use) => { await use(new ProductsPage(page)); },
  registerPage: async ({ page }, use) => { await use(new RegisterPage(page)); },
});