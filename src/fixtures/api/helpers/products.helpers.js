// fixtures/api/helpers/products.helpers.js
import { formBody, buildSearchParams, FORM_HEADERS } from "./utils.js";

export function createProductsHelpers(apiClient) {
  async function getAllProductsList(options = {}) {
    return apiClient.get("/productsList", options);
  }

  async function searchProduct(searchTerm, options = {}) {
    // Keep empty-term tests pointed at the real search contract instead of
    // silently downgrading them to "get all products".
    if (typeof searchTerm === "string" && searchTerm.length === 0) {
      return apiClient.post("/searchProduct", formBody({}), {
        ...options,
        headers: { ...FORM_HEADERS, ...(options.headers || {}) },
      });
    }

    const queryString = buildSearchParams(searchTerm);
    const getResponse = await apiClient.get(`/searchProduct${queryString}`, {
      ...options,
      storeResponse: options.storeResponse ?? true,
    });

    // AutomationExercise sometimes returns HTTP 200 with body.responseCode=405
    const isMethodNotSupported =
      getResponse?.status === 405 ||
      getResponse?.bodyResponseCode === 405 ||
      getResponse?.body?.responseCode === 405;

    // if the endpoint does not support GET, fallback to POST form-encoded
    if (isMethodNotSupported) {
      return apiClient.post(
        "/searchProduct",
        formBody({ search_product: searchTerm }),
        {
          ...options,
          headers: { ...FORM_HEADERS, ...(options.headers || {}) },
        },
      );
    }

    return getResponse;
  }
  return {
    getAllProductsList,
    searchProduct,
  };
}
