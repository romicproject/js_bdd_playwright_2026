import { resolveProductsHappyMock } from "./profiles/products.mock.js";
import { resolveContractDefaultMock } from "./profiles/contract.mock.js";

const PROFILE_RESOLVERS = {
  "contract-default": resolveContractDefaultMock,
  "products-happy": resolveProductsHappyMock,
};

function getParsedUrl(fullUrl) {
  try {
    return new URL(fullUrl);
  } catch {
    return null;
  }
}

export function resolveApiMockResponse({
  method,
  fullUrl,
  requestData,
  requestHeaders,
  apiContext,
}) {
  const enabled = Boolean(apiContext?.mock?.enabled);
  if (!enabled) return null;

  const profile = String(apiContext?.mock?.profile || "").trim();
  if (!profile) return null;

  const resolver = PROFILE_RESOLVERS[profile];
  if (!resolver) return null;

  const parsedUrl = getParsedUrl(fullUrl);

  return resolver({
    method,
    fullUrl,
    pathname: parsedUrl?.pathname ?? String(fullUrl || ""),
    searchParams: parsedUrl?.searchParams ?? new URLSearchParams(),
    requestData,
    requestHeaders,
    apiContext,
  });
}
