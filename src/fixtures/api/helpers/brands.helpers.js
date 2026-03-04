// fixtures/api/helpers/brands.helpers.js
export function createBrandsHelpers(apiClient) {
  return {
    async getAllBrands() {
      return apiClient.get('/brandsList');
    }
  };
}
