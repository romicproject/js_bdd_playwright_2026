// fixtures/api/helpers/index.js
import { createProductsHelpers } from "./products.helpers.js";
import { createBrandsHelpers } from "./brands.helpers.js";
import { createUsersHelpers } from "./users.helpers.js";

export function createApiHelpers(apiClient) {
  const productsHelpers = createProductsHelpers(apiClient);
  const brandsHelpers = createBrandsHelpers(apiClient);
  const usersHelpers = createUsersHelpers(apiClient);

  return {
    getAllProductsList: productsHelpers.getAllProductsList,
    searchProduct: productsHelpers.searchProduct,
    getAllBrands: brandsHelpers.getAllBrands,
    createUser: usersHelpers.createUser,
    verifyLogin: usersHelpers.verifyLogin,
    deleteAccount: usersHelpers.deleteAccount,
    getUserDetailByEmail: usersHelpers.getUserDetailByEmail,
  };
}
