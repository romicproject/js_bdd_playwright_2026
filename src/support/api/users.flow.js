import { expect } from "@playwright/test";
import { buildUserPayload } from "./users.data.js";

function requireUserField(apiContext, userKey, field) {
  const user = apiContext.getUser(userKey);
  const value = user?.[field];
  expect(value, `${userKey}.${field} is not set.`).toBeTruthy();
  return value;
}

function resolveTrackedEmail(apiContext, emailTemplate) {
  const raw = String(emailTemplate ?? "");
  const resolved = apiContext.resolveTemplate(raw);
  const existingUser = apiContext.getUser("existing");

  if (raw.includes("{timestamp}") && existingUser.email) {
    return existingUser.email;
  }

  return resolved;
}

export async function createUserFromTable(
  { apiContext, apiHelpers },
  dataTable,
) {
  const user = apiContext.resolveDataTable(dataTable);

  if (user.email) {
    apiContext.updateUser("created", {
      email: user.email,
      password: user.password,
    });
    apiContext.trackCleanupUser(user.email, user.password);
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

  await apiHelpers.users.createUser(
    buildUserPayload({
      name,
      email: resolvedEmail,
      password,
    }),
    { storeResponse: false },
  );

  apiContext.updateUser("existing", {
    email: resolvedEmail,
    password,
  });
  apiContext.trackCleanupUser(resolvedEmail, password);

  if (saveAsCurrent) {
    apiContext.updateUser("saved", {
      email: resolvedEmail,
      password,
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
