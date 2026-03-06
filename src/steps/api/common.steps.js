// support/steps/api/common.steps.js
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/api/api.fixtures.js';
import { validateSchema } from '../../framework/validation/schemaValidator.js';
import { productListSchema } from '../../schemas/productList.schema.js';
import {
  expectEffectiveStatus,
  expectHttpStatus,
  expectMessageType,
  assertSchema
} from './stepUtils.js';

const { Given, Then } = createBdd(test);

Given('the API is available', async ({ apiClient }) => {
  await apiClient.healthCheck({ path: '/productsList' });
});

Then('the response status should be {int}', async ({ apiContext }, expectedStatus) => {
  expectEffectiveStatus(apiContext, expectedStatus);
});

Then('the http status should be {int}', async ({ apiContext }, expectedStatus) => {
  expectHttpStatus(apiContext, expectedStatus);
});

Then('the response should match product list schema', async ({ apiContext }) => {
  const body = apiContext.response?.body || {};

  assertSchema(body, validateSchema, productListSchema, {
    requiredKey: 'products',
    previewOmitKeys: ['products']
  });
});

Then('the response message should indicate {string}', async ({ apiContext }, messageType) => {
  const messageMap = {
    'account created': /successfully subscribed|user created|account created/i,
    'successful login': /login successful|user exists|success/i,
    'email already exists': /email already exists|already exist/i,
    'user not found': /user not found|not exist/i,
    'missing parameter': /missing|required/i,
    'account deleted': /account deleted|deleted/i,
    'account not found': /account.*not found|not exist/i
  };

  expectMessageType(apiContext, messageType, messageMap);
});
