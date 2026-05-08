export { getEffectiveStatus, getResponseMessage } from "../../framework/http/response.js";

export function requireResponse(apiContext) {
  const res = apiContext?.response;

  if (!res) {
    throw new Error(
      "[RESPONSE] apiContext.response missing. Ensure a When-step executed an API call before asserting.",
    );
  }

  return res;
}

export function getResponseBody(apiContext) {
  const body = requireResponse(apiContext)?.body;
  return body && typeof body === "object" ? body : {};
}

export function getResponseArrayField(apiContext, field) {
  const value = getResponseBody(apiContext)[field];
  return Array.isArray(value) ? value : [];
}
