// fixtures/api/api.fixtures.js
import { test as base } from 'playwright-bdd';
import { config } from '../../../config/envConfig.js';
import { createApiContext } from './apiContext.js';
import { createApiClient } from './apiClient.js';
import { createApiHelpers } from './helpers/index.js';

import { createLogger, getAttachAllureEnabled } from '../../logging/logger.js';
import { buildTestLogPath, inferFeatureFromTestInfo } from '../../logging/paths.js';

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

export const test = base.extend({
  apiContext: async ({ request }, use, testInfo) => {
    const context = createApiContext(request, config);

    context.startTime = Date.now();
    context.scenarioName = testInfo.title;
    context.scenarioTimestamp = Date.now();

    // kind din project.name
    const projectName = testInfo.project?.name || '';
    const kind = /api/i.test(projectName) ? 'API' : 'UI';

    // feature derivat din spec-ul generat de playwright-bdd (stabil)
    const feature = inferFeatureFromTestInfo(testInfo);

    const baseDir = String(env('LOG_DIR', 'logs'));
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

    // expune logger/path în context
    context.logger = logger;
    context.logFilePath = logFilePath;

    logger.info(`Starting: ${testInfo.title}`);
    logger.debug(`Environment: ${config.env}`);
    logger.debug(`Base URL: ${config.apiBaseUrl}`);

    await use(context);

    const duration = Date.now() - context.startTime;
    logger.info(`Completed in ${duration}ms | status=${testInfo.status}`);

    if (getAttachAllureEnabled()) {
      await testInfo.attach('execution.log', {
        path: logFilePath,
        contentType: 'text/plain',
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
