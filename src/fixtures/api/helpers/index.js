// fixtures/api/helpers/index.js
import { createProductsHelpers, createBrandsHelpers } from "./products.helpers.js";
import { createUsersHelpers } from "./users.helpers.js";

export function createApiHelpers(apiClient) {
  return {
    products: createProductsHelpers(apiClient),
    brands: createBrandsHelpers(apiClient),
    users: createUsersHelpers(apiClient),
  };
}
