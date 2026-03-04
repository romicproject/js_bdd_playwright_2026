// support/steps/api/stepUtils.js
import { expect } from '@playwright/test';

/**
 * AutomationExercise API often returns HTTP 200 with a business code in body.responseCode.
 * This helper returns the "effective" status we assert on by default.
 */
export function getEffectiveStatus(res) {
  const body = res?.body || {};
  const hasBodyCode =
    body && typeof body === 'object' && typeof body.responseCode === 'number';

  return hasBodyCode ? body.responseCode : res?.status;
}

/** Normalize message field(s) */
export function getResponseMessage(res) {
  const body = res?.body || {};
  const msg = body?.message ?? body?.responseMessage ?? body?.response_message;
  return String(msg ?? '');
}

export function requireResponse(apiContext) {
  const res = apiContext?.response;

  expect(
    res,
    'apiContext.response missing. Ensure a When-step executed an API call before asserting.'
  ).toBeTruthy();

  return res;
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
    body && typeof body === 'object' && typeof body.responseCode === 'number';

  expect(
    actual,
    [
      `Unexpected status. expected=${expectedStatus}, actual=${actual}.`,
      `http=${res.status}, body.responseCode=${hasBodyCode ? body.responseCode : 'n/a'}`,
      msg ? `message="${msg}"` : ''
    ].filter(Boolean).join(' ')
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
      typeof res?.body?.responseCode === 'number'
        ? `body.responseCode=${res.body.responseCode}`
        : '',
      msg ? `message="${msg}"` : ''
    ].filter(Boolean).join(' ')
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
  expect(pattern, `Unknown messageType "${messageType}". Update messageMap.`).toBeTruthy();

  expect(
    message,
    `Message mismatch for type="${messageType}". Actual="${message}"`
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
  const {
    requiredKey,
    previewOmitKeys = []
  } = options;

  const safeBody = body ?? {};

  if (requiredKey && safeBody[requiredKey] === undefined) {
    throw new Error(
      `Expected response to include '${requiredKey}' but it was missing. Response received: ${JSON.stringify(safeBody)}`
    );
  }

  const validation = validateSchemaFn(safeBody, schema);

  if (!validation.valid) {
    const errors = JSON.stringify(validation.errors || [], null, 2);

    const preview = { ...safeBody };
    for (const k of previewOmitKeys) {
      if (k in preview) preview[k] = '[omitted]';
    }

    throw new Error(
      `Schema validation failed.\nErrors:\n${errors}\n\nResponse preview:\n${JSON.stringify(preview, null, 2)}`
    );
  }

  return true;
}

/**
 * Build a default user payload for createAccount.
 * You can override any field via overrides (email/password/etc).
 */
export function buildUserPayload(overrides = {}) {
  return {
    name: 'Test User',
    title: 'Mr',
    birth_date: '1',
    birth_month: '1',
    birth_year: '1990',
    firstname: 'Test',
    lastname: 'User',
    company: 'Test Company',
    address1: '123 Test St',
    country: 'United States',
    zipcode: '12345',
    state: 'Test State',
    city: 'Test City',
    mobile_number: '1234567890',
    ...overrides
  };
}

/**
 * Resolve an email string:
 * - supports {timestamp} via apiContext.resolveTemplate()
 * - if caller passed template and apiContext.existingUserEmail exists, prefer it
 */
export function resolveEmail(apiContext, emailTemplate) {
  const raw = String(emailTemplate ?? '');
  const resolved = apiContext.resolveTemplate(raw);

  if (raw.includes('{timestamp}') && apiContext.existingUserEmail) {
    return apiContext.existingUserEmail;
  }
  return resolved;
}
