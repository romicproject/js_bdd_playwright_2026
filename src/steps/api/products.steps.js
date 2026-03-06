// support/steps/api/products.steps.js
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/api/api.fixtures.js';
import { validateSchema } from '../../framework/validation/schemaValidator.js';
import { brandListSchema } from '../../schemas/brandList.schema.js';
import { assertSchema } from './stepUtils.js';

const { When, Then } = createBdd(test);

// Products - Get All
When('I get all products', async ({ apiContext, apiHelpers }) => {
  apiContext.response = await apiHelpers.getAllProductsList();
});

Then('the response should contain products', async ({ apiContext }) => {
  const body = apiContext.response?.body || {};
  expect(body.products).toBeDefined();
  expect(Array.isArray(body.products)).toBe(true);
  expect(body.products.length).toBeGreaterThan(0);
});

Then('each product should have required fields', async ({ apiContext }) => {
  const products = apiContext.response?.body?.products || [];
  expect(Array.isArray(products)).toBe(true);

  products.forEach((product, index) => {
    expect(product.id, `Product ${index} should have id`).toBeDefined();
    expect(product.name, `Product ${index} should have name`).toBeDefined();
    expect(product.price, `Product ${index} should have price`).toBeDefined();
    expect(product.brand, `Product ${index} should have brand`).toBeDefined();
  });
});

// Products - Search
When('I search for product {string}', async ({ apiContext, apiHelpers }, searchTerm) => {
  apiContext.response = await apiHelpers.searchProduct(searchTerm);
  apiContext.searchTerm = searchTerm;
});

Then('the response should contain products matching {string}', async ({ apiContext }, searchTerm) => {
  const products = apiContext.response?.body?.products || [];
  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBeGreaterThan(0);

  products.forEach(product => {
    const productText = `${product.name} ${product.brand} ${product.category?.category || ''}`.toLowerCase();
    expect(productText).toContain(searchTerm.toLowerCase());
  });
});

Then('the products list should be empty', async ({ apiContext }) => {
  const products = apiContext.response?.body?.products || [];
  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBe(0);
});

// Brands
When('I get all brands', async ({ apiContext, apiHelpers }) => {
  apiContext.response = await apiHelpers.getAllBrands();
});

Then('the response should contain brands', async ({ apiContext }) => {
  const body = apiContext.response?.body || {};

  assertSchema(body, validateSchema, brandListSchema, {
    requiredKey: 'brands',
    previewOmitKeys: ['brands']
  });

  expect(body.brands.length).toBeGreaterThan(0);
});

Then('each brand should have required fields', async ({ apiContext }) => {
  const brands = apiContext.response?.body?.brands || [];
  expect(Array.isArray(brands)).toBe(true);

  brands.forEach((brand, index) => {
    expect(brand.id, `Brand ${index} should have id`).toBeDefined();
    expect(brand.brand, `Brand ${index} should have brand name`).toBeDefined();
  });
});
