// fixtures/api/helpers/index.js
import { createProductsHelpers } from "./products.helpers.js";
import { createBrandsHelpers } from "./brands.helpers.js";
import { createUsersHelpers } from "./users.helpers.js";

export function createApiHelpers(apiClient) {
  return {
    products: createProductsHelpers(apiClient),
    brands: createBrandsHelpers(apiClient),
    users: createUsersHelpers(apiClient),
  };
}
