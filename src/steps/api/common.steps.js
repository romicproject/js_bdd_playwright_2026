// src/steps/api/common.steps.js
import { createBdd } from "playwright-bdd";
import { test } from "../../fixtures/api/api.fixtures.js";
import { productListSchema } from "../../schemas/productList.schema.js";
import {
  expectEffectiveStatus,
  expectHttpStatus,
  expectMessageType,
  assertSchema,
  getResponseBody,
} from "../../support/api/response.assertions.js";
import {
  MESSAGE_TYPE_REGISTRY,
  MESSAGE_TYPE_PATTERNS,
} from "../../support/api/messageTypes.js";

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
    assertSchema(getResponseBody(apiContext), productListSchema, {
      requiredKey: "products",
      previewOmitKeys: ["products"],
      logger: apiContext.getLogger(),
    });
  },
);

Then(
  "the response message should indicate {string}",
  async ({ apiContext }, messageType) => {
    const entry = MESSAGE_TYPE_REGISTRY[messageType];
    const body = getResponseBody(apiContext);

    if (entry?.schema) {
      assertSchema(body, entry.schema, {
        logger: apiContext.getLogger(),
      });
    }

    expectMessageType(apiContext, messageType, MESSAGE_TYPE_PATTERNS);
  },
);
