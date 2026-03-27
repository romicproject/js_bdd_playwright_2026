import { resolveProductsHappyMock } from "./profiles/products.mock.js";

const PROFILE_RESOLVERS = {
  "products-happy": resolveProductsHappyMock,
};

function getPathname(fullUrl) {
  try {
    return new URL(fullUrl).pathname;
  } catch {
    return String(fullUrl || "");
  }
}

export function resolveApiMockResponse({ method, fullUrl, apiContext }) {
  const enabled = Boolean(apiContext?.mock?.enabled);
  if (!enabled) return null;

  const profile = String(apiContext?.mock?.profile || "").trim();
  if (!profile) return null;

  const resolver = PROFILE_RESOLVERS[profile];
  if (!resolver) return null;

  return resolver({
    method,
    fullUrl,
    pathname: getPathname(fullUrl),
    apiContext,
  });
}
