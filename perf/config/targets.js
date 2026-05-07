import {
  config,
  requireApiConfig,
  requireUiConfig,
} from "../../src/framework/config/envConfig.js";

export function resolvePerfConfig() {
  // Use centralized config from envConfig instead of duplicating env lookups.
  // This ensures perf scenarios use the same URLs as test framework.
  const apiConfig = requireApiConfig();
  const uiConfig = requireUiConfig();

  return {
    env: config.env,
    targetApi: apiConfig.apiBaseUrl,
    targetUi: uiConfig.baseUrl,
    endpoints: {
      productsList: "/productsList",
      searchProduct: "/searchProduct",
      verifyLogin: "/verifyLogin",
    },
  };
}
