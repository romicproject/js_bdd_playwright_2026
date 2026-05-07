import { expect } from "@playwright/test";
import { buildTrackedUserRecord, buildUserPayload } from "./users.data.js";

function requireUserField(apiContext, userKey, field) {
  const user = apiContext.getUser(userKey);
  const value = user?.[field];
  expect(value, `${userKey}.${field} is not set.`).toBeTruthy();
  return value;
}

/**
 * Resolve email from template, with smart fallback to existing/saved user.
 *
 * Logic:
 * - If emailTemplate contains {unique} AND an "existing" user is already set,
 *   return the existing user's email (for reuse across multiple steps)
 * - Otherwise, resolve template placeholders like {unique} normally
 *
 * This allows scenarios to reuse the same email across multiple operations
 * without repeating the template in each step.
 *
 * Example:
 *   Given a user exists with email "duplicate.{unique}@test.com"  ← sets "existing"
 *   When I create a user with:
 *     | email | duplicate.{unique}@test.com |  ← reuses existing email
 *
 * @param {object} apiContext - API context with user state
 * @param {string} emailTemplate - Email template, possibly with {unique} placeholder
 * @returns {string} Resolved email
 */
function resolveTrackedEmail(apiContext, emailTemplate) {
  const raw = String(emailTemplate ?? "");
  const resolved = apiContext.resolveTemplate(raw);
  const existingUser = apiContext.getUser("existing");

  if (raw.includes("{unique}") && existingUser.email) {
    return existingUser.email;
  }

  return resolved;
}

export async function createUserFromTable(
  { apiContext, apiHelpers },
  dataTable,
) {
  const user = apiContext.resolveDataTable(dataTable);
  const trackedUser = buildTrackedUserRecord(user);

  if (user.email) {
    apiContext.updateUser("created", {
      email: trackedUser.email,
      password: trackedUser.password,
    });
    apiContext.trackCleanupUser(trackedUser.email, trackedUser.password);
  }

  apiContext.response = await apiHelpers.users.createUser(user);
}

export async function ensureUserExists({ apiContext, apiHelpers }, options) {
  const {
    email,
    password,
    name = "Existing User",
    saveAsCurrent = false,
  } = options;
  const resolvedEmail = apiContext.resolveTemplate(email);
  const trackedUser = buildTrackedUserRecord({
    email: resolvedEmail,
    password,
  });

  await apiHelpers.users.createUser(
    buildUserPayload({
      name,
      ...trackedUser,
    }),
    { storeResponse: false },
  );

  apiContext.updateUser("existing", {
    email: trackedUser.email,
    password: trackedUser.password,
  });
  apiContext.trackCleanupUser(trackedUser.email, trackedUser.password);

  if (saveAsCurrent) {
    apiContext.updateUser("saved", {
      email: trackedUser.email,
      password: trackedUser.password,
    });
  }
}

export async function verifyLoginFromTable(
  { apiContext, apiHelpers },
  dataTable,
) {
  const login = apiContext.resolveDataTable(dataTable);
  apiContext.response = await apiHelpers.users.verifyLogin(login);
}

export async function verifyLoginWithCreatedUser({ apiContext, apiHelpers }) {
  apiContext.response = await apiHelpers.users.verifyLogin({
    email: requireUserField(apiContext, "created", "email"),
    password: requireUserField(apiContext, "created", "password"),
  });
}

export async function verifyLoginWithSavedUser({ apiContext, apiHelpers }) {
  apiContext.response = await apiHelpers.users.verifyLogin({
    email: requireUserField(apiContext, "saved", "email"),
    password: requireUserField(apiContext, "saved", "password"),
  });
}

export async function deleteAccountWithCredentials(
  { apiContext, apiHelpers },
  email,
  password,
) {
  const resolved = resolveTrackedEmail(apiContext, email);
  apiContext.response = await apiHelpers.users.deleteAccount({
    email: resolved,
    password,
  });
  apiContext.untrackCleanupUser(resolved);
}

export async function deleteAccountWithSavedUser({ apiContext, apiHelpers }) {
  const email = requireUserField(apiContext, "saved", "email");
  apiContext.response = await apiHelpers.users.deleteAccount({
    email,
    password: requireUserField(apiContext, "saved", "password"),
  });
  apiContext.untrackCleanupUser(email);
}

export async function getUserDetailByEmail({ apiContext, apiHelpers }, email) {
  apiContext.response = await apiHelpers.users.getUserDetailByEmail(
    apiContext.resolveTemplate(email),
  );
}

export async function getUserDetailBySavedUser({ apiContext, apiHelpers }) {
  apiContext.response = await apiHelpers.users.getUserDetailByEmail(
    requireUserField(apiContext, "saved", "email"),
  );
}

export function saveCreatedUser(apiContext) {
  apiContext.updateUser("saved", {
    email: requireUserField(apiContext, "created", "email"),
    password: requireUserField(apiContext, "created", "password"),
  });
}
