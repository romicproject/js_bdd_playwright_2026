// fixtures/api/helpers/products.helpers.js
import { buildForm, buildSearchParams, FORM_HEADERS } from './utils.js';

export function createProductsHelpers(apiClient) {
  async function getAllProductsList(options = {}) {
    return apiClient.get('/productsList', options);
  }

  async function searchProduct(searchTerm, options = {}) {
    // if called with "", return the full list (existing behavior) instead of 400 Bad Request
    if (typeof searchTerm === 'string' && searchTerm.length === 0) {
      return getAllProductsList(options);
    }

    const queryString = buildSearchParams(searchTerm);
    const getResponse = await apiClient.get(`/searchProduct${queryString}`, {
      ...options,
      storeResponse: options.storeResponse ?? true
    });

    // AutomationExercise sometimes returns HTTP 200 with body.responseCode=405
    const isMethodNotSupported =
      getResponse?.status === 405 ||
      getResponse?.bodyResponseCode === 405 ||
      getResponse?.body?.responseCode === 405;

    // if the endpoint does not support GET, fallback to POST form-encoded
    if (isMethodNotSupported) {
      return apiClient.post(
        '/searchProduct',
        buildForm({ search_product: searchTerm }).toString(),
        { ...options, headers: { ...FORM_HEADERS, ...(options.headers || {}) } }
      );
    }

    return getResponse;
  }

  async function getProductById(productId, options = {}) {
    return apiClient.post(
      '/searchProduct',
      buildForm({ product_id: productId }).toString(),
      { ...options, headers: { ...FORM_HEADERS, ...(options.headers || {}) } }
    );
  }

  return {
    getAllProductsList,
    searchProduct,
    getProductById
  };
}