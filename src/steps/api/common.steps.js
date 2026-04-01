// src/steps/api/common.steps.js
import { createBdd } from "playwright-bdd";
import { test } from "../../fixtures/api/api.fixtures.js";
import { validateSchema } from "../../framework/validation/schemaValidator.js";
import {
  badRequestSchema,
  notFoundSchema,
} from "../../schemas/error.schema.js";
import { productListSchema } from "../../schemas/productList.schema.js";
import {
  deleteSuccessSchema,
  loginSuccessSchema,
  userCreatedSchema,
} from "../../schemas/user.schema.js";
import {
  expectEffectiveStatus,
  expectHttpStatus,
  expectMessageType,
  assertSchema,
  getResponseBody,
} from "../../support/api/response.assertions.js";

const { Before, Given, Then } = createBdd(test);

function enableMockProfile(apiContext, profile = "contract-default") {
  apiContext.mock.enabled = true;
  apiContext.mock.profile = profile;
}

Before({ tags: "@mock" }, async ({ apiContext }) => {
  if (!apiContext.mock.profile) {
    enableMockProfile(apiContext);
    return;
  }

  apiContext.mock.enabled = true;
});

Given(
  "API mock profile {string} is enabled",
  async ({ apiContext }, profile) => {
    enableMockProfile(apiContext, profile);
  },
);

Given("the API is available", async ({ apiAvailability }) => {
  await apiAvailability.ensure();
});

Then(
  "the response status should be {int}",
  async ({ apiContext }, expectedStatus) => {
    expectEffectiveStatus(apiContext, expectedStatus);
  },
);

Then(
  "the http status should be {int}",
  async ({ apiContext }, expectedStatus) => {
    expectHttpStatus(apiContext, expectedStatus);
  },
);

Then(
  "the response should match product list schema",
  async ({ apiContext }) => {
    const body = getResponseBody(apiContext);

    assertSchema(body, validateSchema, productListSchema, {
      requiredKey: "products",
      previewOmitKeys: ["products"],
      logger: apiContext.getLogger(),
    });
  },
);

Then(
  "the response message should indicate {string}",
  async ({ apiContext }, messageType) => {
    const messageMap = {
      "account created":
        /successfully subscribed|user created|account created/i,
      "successful login": /login successful|user exists|success/i,
      "email already exists": /email already exists|already exist/i,
      "user not found": /user not found|not exist/i,
      "missing parameter": /missing|required/i,
      "account deleted": /account deleted|deleted/i,
      "account not found": /account.*not found|not exist/i,
    };

    const schemaMap = {
      "account created": userCreatedSchema,
      "successful login": loginSuccessSchema,
      "email already exists": badRequestSchema,
      "user not found": notFoundSchema,
      "missing parameter": badRequestSchema,
      "account deleted": deleteSuccessSchema,
      "account not found": notFoundSchema,
    };

    const body = getResponseBody(apiContext);
    const schema = schemaMap[messageType];
    if (schema) {
      assertSchema(body, validateSchema, schema, {
        logger: apiContext.getLogger(),
      });
    }

    expectMessageType(apiContext, messageType, messageMap);
  },
);
