// src/steps/api/common.steps.js
import { createBdd } from "playwright-bdd";
import { test } from "../../fixtures/api/api.fixtures.js";
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

    assertSchema(body, productListSchema, {
      requiredKey: "products",
      previewOmitKeys: ["products"],
      logger: apiContext.getLogger(),
    });
  },
);

Then(
  "the response message should indicate {string}",
  async ({ apiContext }, messageType) => {
    const MESSAGE_TYPES = {
      "account created": {
        pattern: /successfully subscribed|user created|account created/i,
        schema: userCreatedSchema,
      },
      "successful login": {
        pattern: /login successful|user exists|success/i,
        schema: loginSuccessSchema,
      },
      "email already exists": {
        pattern: /email already exists|already exist/i,
        schema: badRequestSchema,
      },
      "user not found": {
        pattern: /user not found|not exist/i,
        schema: notFoundSchema,
      },
      "missing parameter": {
        pattern: /missing|required/i,
        schema: badRequestSchema,
      },
      "account deleted": {
        pattern: /account deleted|deleted/i,
        schema: deleteSuccessSchema,
      },
      "account not found": {
        pattern: /account.*not found|not exist/i,
        schema: notFoundSchema,
      },
    };

    const entry = MESSAGE_TYPES[messageType];
    const body = getResponseBody(apiContext);
    if (entry?.schema) {
      assertSchema(body, entry.schema, {
        logger: apiContext.getLogger(),
      });
    }

    expectMessageType(
      apiContext,
      messageType,
      Object.fromEntries(
        Object.entries(MESSAGE_TYPES).map(([k, v]) => [k, v.pattern]),
      ),
    );
  },
);
