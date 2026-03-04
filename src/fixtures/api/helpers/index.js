// fixtures/api/helpers/index.js
import { createProductsHelpers } from './products.helpers.js';
import { createBrandsHelpers } from './brands.helpers.js';
import { createUsersHelpers } from './users.helpers.js';

export function createApiHelpers(apiClient) {
  const productsHelpers = createProductsHelpers(apiClient);
  const brandsHelpers = createBrandsHelpers(apiClient);
  const usersHelpers = createUsersHelpers(apiClient);

  return {
    // Products
    getAllProductsList: productsHelpers.getAllProductsList,
    searchProduct: productsHelpers.searchProduct,
    getProductById: productsHelpers.getProductById,

    // Brands
    getAllBrands: brandsHelpers.getAllBrands,

    // Users
    createUser: usersHelpers.createUser,
    verifyLogin: usersHelpers.verifyLogin,
    deleteAccount: usersHelpers.deleteAccount,
    updateAccount: usersHelpers.updateAccount,
    getUserDetailByEmail: usersHelpers.getUserDetailByEmail,

    // Namespaced access (optional)
    products: productsHelpers,
    brands: brandsHelpers,
    users: usersHelpers
  };
}
