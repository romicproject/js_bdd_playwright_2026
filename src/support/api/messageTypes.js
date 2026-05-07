// src/support/api/messageTypes.js
// Centralized message type registry for API response assertions.
// Extracted from common.steps.js so it can be reused in step files, helpers, and tests.

import {
  badRequestSchema,
  notFoundSchema,
} from "../../schemas/error.schema.js";
import {
  deleteSuccessSchema,
  loginSuccessSchema,
  userCreatedSchema,
} from "../../schemas/user.schema.js";

/**
 * Registry of known message types for "the response message should indicate {string}" step.
 *
 * Each entry:
 *   - pattern {RegExp}  matched against body.message / body.responseMessage
 *   - schema  {ZodSchema} validated against full response body
 */
export const MESSAGE_TYPE_REGISTRY = {
  "account created": {
    pattern: /successfully subscribed|user created|account created/i,
    schema: userCreatedSchema,
  },
  "successful login": {
    pattern: /login successful|user exists|success/i,
    schema: loginSuccessSchema,
  },
  "email already exists": {
    pattern: /email already exists|already exist/i,
    schema: badRequestSchema,
  },
  "user not found": {
    pattern: /user not found|not exist/i,
    schema: notFoundSchema,
  },
  "missing parameter": {
    pattern: /missing|required/i,
    schema: badRequestSchema,
  },
  "account deleted": {
    pattern: /account deleted|deleted/i,
    schema: deleteSuccessSchema,
  },
  "account not found": {
    pattern: /account.*not found|not exist/i,
    schema: notFoundSchema,
  },
};

/**
 * Extract only the pattern map for use with expectMessageType().
 */
export const MESSAGE_TYPE_PATTERNS = Object.fromEntries(
  Object.entries(MESSAGE_TYPE_REGISTRY).map(([k, v]) => [k, v.pattern]),
);
