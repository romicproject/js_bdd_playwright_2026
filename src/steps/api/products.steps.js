// src/steps/api/products.steps.js
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/api/api.fixtures.js";
import { brandListSchema } from "../../schemas/brandList.schema.js";
import {
  assertSchema,
  expectArrayFieldEmpty,
  expectArrayFieldHasItems,
  expectArrayItemsMatch,
  expectObjectsHaveKeys,
  getResponseArrayField,
  getResponseBody,
} from "../../support/api/response.assertions.js";

const { When, Then } = createBdd(test);

// Products - Get All
When("I get all products", async ({ apiContext, apiHelpers }) => {
  apiContext.response = await apiHelpers.products.getAllProductsList();
});

Then("the response should contain products", async ({ apiContext }) => {
  const body = getResponseBody(apiContext);
  expect(body.products).toBeDefined();
  expectArrayFieldHasItems(apiContext, "products");
});

Then("each product should have required fields", async ({ apiContext }) => {
  const products = getResponseArrayField(apiContext, "products");
  expectObjectsHaveKeys(products, ["id", "name", "price", "brand"], "Product");
});

// Products - Search
When(
  "I search for product {string}",
  async ({ apiContext, apiHelpers }, searchTerm) => {
    apiContext.response = await apiHelpers.products.searchProduct(searchTerm);
  },
);

Then(
  "the response should contain products matching {string}",
  async ({ apiContext }, searchTerm) => {
    expectArrayFieldHasItems(apiContext, "products");
    expectArrayItemsMatch(
      apiContext,
      "products",
      (product) => {
        const productText =
          `${product.name} ${product.brand} ${product.category?.category || ""}`.toLowerCase();
        return productText.includes(searchTerm.toLowerCase());
      },
      `products matching "${searchTerm}"`,
    );
  },
);

Then("the products list should be empty", async ({ apiContext }) => {
  expectArrayFieldEmpty(apiContext, "products");
});

// Brands
When("I get all brands", async ({ apiContext, apiHelpers }) => {
  apiContext.response = await apiHelpers.brands.getAllBrands();
});

Then("the response should contain brands", async ({ apiContext }) => {
  const body = getResponseBody(apiContext);

  assertSchema(body, validateSchema, brandListSchema, {
    requiredKey: "brands",
    previewOmitKeys: ["brands"],
    logger: apiContext.getLogger(),
  });

  expectArrayFieldHasItems(apiContext, "brands");
});

Then("each brand should have required fields", async ({ apiContext }) => {
  const brands = getResponseArrayField(apiContext, "brands");
  expectObjectsHaveKeys(brands, ["id", "brand"], "Brand");
});
