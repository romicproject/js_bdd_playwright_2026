import { expect } from "@playwright/test";

/**
 * AutomationExercise API often returns HTTP 200 with a business code in body.responseCode.
 * This helper returns the "effective" status we assert on by default.
 */
export function getEffectiveStatus(res) {
  const body = res?.body || {};
  const hasBodyCode =
    body && typeof body === "object" && typeof body.responseCode === "number";

  return hasBodyCode ? body.responseCode : res?.status;
}

/** Normalize message field(s) */
export function getResponseMessage(res) {
  const body = res?.body || {};
  const msg = body?.message ?? body?.responseMessage ?? body?.response_message;
  return String(msg ?? "");
}

export function requireResponse(apiContext) {
  const res = apiContext?.response;

  expect(
    res,
    "apiContext.response missing. Ensure a When-step executed an API call before asserting.",
  ).toBeTruthy();

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

export function getResponseObjectField(apiContext, field) {
  const value = getResponseBody(apiContext)[field];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function expectArrayFieldHasItems(apiContext, field, options = {}) {
  const { min = 1, message } = options;
  const items = getResponseArrayField(apiContext, field);

  expect(
    items.length,
    message ||
      `Expected response field "${field}" to contain at least ${min} item(s).`,
  ).toBeGreaterThanOrEqual(min);

  return items;
}

export function expectArrayFieldEmpty(apiContext, field, options = {}) {
  const items = getResponseArrayField(apiContext, field);

  expect(
    items.length,
    options.message || `Expected response field "${field}" to be empty.`,
  ).toBe(0);

  return items;
}

export function expectObjectsHaveKeys(items, requiredKeys, label = "Item") {
  items.forEach((item, index) => {
    requiredKeys.forEach((key) => {
      expect(item?.[key], `${label} ${index} should have ${key}`).toBeDefined();
    });
  });

  return items;
}

export function expectArrayItemsMatch(
  apiContext,
  field,
  predicate,
  description = field,
) {
  const items = getResponseArrayField(apiContext, field);

  items.forEach((item, index) => {
    expect(
      predicate(item, index),
      `Expected ${description} item ${index} to match predicate.`,
    ).toBe(true);
  });

  return items;
}

/**
 * Assert effective status (body.responseCode if present, else HTTP status).
 * Includes both for diagnostics.
 */
export function expectEffectiveStatus(apiContext, expectedStatus) {
  const res = requireResponse(apiContext);

  const actual = getEffectiveStatus(res);
  const msg = getResponseMessage(res);

  const body = res?.body || {};
  const hasBodyCode =
    body && typeof body === "object" && typeof body.responseCode === "number";

  expect(
    actual,
    [
      `Unexpected status. expected=${expectedStatus}, actual=${actual}.`,
      `http=${res.status}, body.responseCode=${hasBodyCode ? body.responseCode : "n/a"}`,
      msg ? `message="${msg}"` : "",
    ]
      .filter(Boolean)
      .join(" "),
  ).toBe(expectedStatus);

  return res;
}

/** Assert strict HTTP status only (ignores body.responseCode). */
export function expectHttpStatus(apiContext, expectedStatus) {
  const res = requireResponse(apiContext);
  const msg = getResponseMessage(res);

  expect(
    res.status,
    [
      `Unexpected HTTP status. expected=${expectedStatus}, actual=${res.status}.`,
      typeof res?.body?.responseCode === "number"
        ? `body.responseCode=${res.body.responseCode}`
        : "",
      msg ? `message="${msg}"` : "",
    ]
      .filter(Boolean)
      .join(" "),
  ).toBe(expectedStatus);

  return res;
}

/**
 * Map-based message assertion (kept centralized).
 */
export function expectMessageType(apiContext, messageType, messageMap) {
  const res = requireResponse(apiContext);
  const message = getResponseMessage(res);

  const pattern = messageMap[messageType];
  expect(
    pattern,
    `Unknown messageType "${messageType}". Update messageMap.`,
  ).toBeTruthy();

  expect(
    message,
    `Message mismatch for type="${messageType}". Actual="${message}"`,
  ).toMatch(pattern);

  return res;
}

/**
 * Generic JSON schema assertion.
 * - validateSchemaFn: your validator function (validateSchema)
 * - schema: JSON schema object
 * - options.requiredKey: if present, asserts that body has that key (e.g. "products", "brands")
 * - options.previewOmitKeys: keys to omit in preview (useful for big arrays)
 */
export function assertSchema(body, validateSchemaFn, schema, options = {}) {
  const { requiredKey, previewOmitKeys = [], logger } = options;

  const safeBody = body ?? {};

  if (requiredKey && safeBody[requiredKey] === undefined) {
    throw new Error(
      `[RESPONSE] Expected response to include '${requiredKey}' but it was missing. Response received: ${JSON.stringify(safeBody)}`,
    );
  }

  // Suppress internal logging - assertSchema throws a comprehensive error anyway
  const validation = validateSchemaFn(safeBody, schema, { logger: null });

  if (!validation.valid) {
    const errors = JSON.stringify(validation.errors || [], null, 2);

    const preview = { ...safeBody };
    for (const key of previewOmitKeys) {
      if (key in preview) preview[key] = "[omitted]";
    }

    throw new Error(
      `[RESPONSE] Schema validation failed.\nErrors:\n${errors}\n\nResponse preview:\n${JSON.stringify(preview, null, 2)}`,
    );
  }

  return true;
}
