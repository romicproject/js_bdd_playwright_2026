import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/ui/ui.fixtures.js';
import {
  openSignupLogin,
  createAccountWithUniqueUser,
  ensureAccountCreatedAndLoggedIn,
  assertLoggedInWithContext,
  assertDuplicateEmailErrorWithContext,
} from '../../support/ui/register.helpers.js';

const { Given, When, Then } = createBdd(test);

Given('I am on the Signup Login page', async ({ homePage, loginPage }) => {
  await openSignupLogin({ homePage, loginPage });
});

When('I register a new user with unique credentials', async ({ homePage, loginPage, registerPage, uiContext }) => {
  await createAccountWithUniqueUser({ homePage, loginPage, registerPage, uiContext });
});

Then('I should see the account created confirmation', async ({ registerPage }) => {
  await registerPage.assertAccountCreated();
});

Then('I should see the user logged in successfully', async ({ registerPage, uiContext }) => {
  await registerPage.continueAfterAccountCreated();
  await assertLoggedInWithContext({ registerPage, uiContext });
});

Given('an account exists for a unique user', async ({ homePage, loginPage, registerPage, uiContext }) => {
  await ensureAccountCreatedAndLoggedIn({ homePage, loginPage, registerPage, uiContext });
});

When('I try to register again with the same email', async ({ homePage, loginPage, uiContext }) => {
  await homePage.clickTopNavigation('Logout');
  await loginPage.assertOnLoginPage();

  const { name, email } = uiContext.state.register.user;
  await loginPage.submitNewUserSignup(`${name}Again`, email);
});

Then('I should see an email already exists error message', async ({ loginPage, uiContext }) => {
  await assertDuplicateEmailErrorWithContext({ loginPage, uiContext });
});
