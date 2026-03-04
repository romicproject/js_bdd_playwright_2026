import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/api/api.fixtures.js';
import { buildUserPayload, resolveEmail } from './stepUtils.js';

const { Given, When, Then } = createBdd(test);

// ----------------------
// CREATE USER
// ----------------------
When('I create a user with:', async ({ apiContext, apiHelpers }, dataTable) => {
  const user = apiContext.resolveDataTable(dataTable.rowsHash());

  if (user.email) {
    apiContext.createdUserEmail = user.email;
    apiContext.createdUserPassword = user.password;
  }

  apiContext.response = await apiHelpers.createUser(user);
});

// ----------------------
// GIVEN USER EXISTS (setup-only)
// ----------------------
Given(
  'a user exists with email {string} and password {string}',
  async ({ apiContext, apiHelpers }, email, password) => {
    const resolvedEmail = apiContext.resolveTemplate(email);

    await apiHelpers.createUser(
      buildUserPayload({ email: resolvedEmail, password }),
      { storeResponse: false }
    );

    apiContext.existingUserEmail = resolvedEmail;
    apiContext.existingUserPassword = password;
  }
);

Given('a user exists with email {string}', async ({ apiContext, apiHelpers }, email) => {
  const resolvedEmail = apiContext.resolveTemplate(email);
  const password = 'Delete123!';

  await apiHelpers.createUser(
    buildUserPayload({ name: 'Existing User', email: resolvedEmail, password }),
    { storeResponse: false }
  );

  apiContext.existingUserEmail = resolvedEmail;
  apiContext.existingUserPassword = password;

  apiContext.savedUserEmail = resolvedEmail;
  apiContext.savedUserPassword = password;
});

// ----------------------
// LOGIN
// ----------------------
When('I verify login with:', async ({ apiContext, apiHelpers }, dataTable) => {
  const login = apiContext.resolveDataTable(dataTable.rowsHash());
  apiContext.response = await apiHelpers.verifyLogin(login);
});

When('I verify login with the created user credentials', async ({ apiContext, apiHelpers }) => {
  expect(apiContext.createdUserEmail, 'createdUserEmail is not set.').toBeTruthy();
  expect(apiContext.createdUserPassword, 'createdUserPassword is not set.').toBeTruthy();

  apiContext.response = await apiHelpers.verifyLogin({
    email: apiContext.createdUserEmail,
    password: apiContext.createdUserPassword
  });
});

When('I verify login with the saved user credentials', async ({ apiContext, apiHelpers }) => {
  expect(apiContext.savedUserEmail, 'savedUserEmail is not set.').toBeTruthy();
  expect(apiContext.savedUserPassword, 'savedUserPassword is not set.').toBeTruthy();

  apiContext.response = await apiHelpers.verifyLogin({
    email: apiContext.savedUserEmail,
    password: apiContext.savedUserPassword
  });
});

// ----------------------
// DELETE (atomic)
// ----------------------
When(
  'I delete account with email {string} and password {string}',
  async ({ apiContext, apiHelpers }, email, password) => {
    apiContext.response = await apiHelpers.deleteAccount({
      email: resolveEmail(apiContext, email),
      password
    });
  }
);

When('I delete account with the saved user credentials', async ({ apiContext, apiHelpers }) => {
  expect(apiContext.savedUserEmail, 'savedUserEmail is not set.').toBeTruthy();
  expect(apiContext.savedUserPassword, 'savedUserPassword is not set.').toBeTruthy();

  apiContext.response = await apiHelpers.deleteAccount({
    email: apiContext.savedUserEmail,
    password: apiContext.savedUserPassword
  });
});

// ----------------------
// USER DETAIL (atomic) - ACT steps
// ----------------------
When('I get user detail by email {string}', async ({ apiContext, apiHelpers }, email) => {
  const resolvedEmail = apiContext.resolveTemplate(email);
  apiContext.response = await apiHelpers.getUserDetailByEmail(resolvedEmail);
});

When('I get user detail by the saved user email', async ({ apiContext, apiHelpers }) => {
  const email = apiContext.savedUserEmail;
  expect(email, 'savedUserEmail is not set.').toBeTruthy();

  apiContext.response = await apiHelpers.getUserDetailByEmail(email);
});

// ----------------------
// SAVE USER
// ----------------------
Then('I save the created user email', async ({ apiContext }) => {
  expect(apiContext.createdUserEmail, 'createdUserEmail is not set.').toBeTruthy();
  expect(apiContext.createdUserPassword, 'createdUserPassword is not set.').toBeTruthy();

  apiContext.savedUserEmail = apiContext.createdUserEmail;
  apiContext.savedUserPassword = apiContext.createdUserPassword;
});