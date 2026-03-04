export function buildUniqueUser() {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const emailPrefix = 'ui.register';

  return {
    name: `User${uniqueId}`,
    email: `${emailPrefix}.${uniqueId}@example.test`,
    password: 'Test123!Pass',
    firstName: 'Test',
    lastName: 'User',
    address: '123 Maple Street',
    state: 'Ontario',
    city: 'Toronto',
    zipcode: 'M5V3L9',
    mobileNumber: `555${Math.floor(Math.random() * 9000000 + 1000000)}`,
  };
}

export function buildRegisterUserMeta() {
  return {
    createdAt: new Date().toISOString(),
    scenarioTag: '@register',
    sourceFeature: 'register-user.feature',
    cleanupPending: true,
  };
}

export async function openSignupLogin({ homePage, loginPage }) {
  await homePage.open();
  await homePage.clickSignupLogin();
  await loginPage.assertOnLoginPage();
}

export async function createAccountWithUniqueUser({ homePage, loginPage, registerPage, uiContext }) {
  const user = buildUniqueUser();
  uiContext.state.register.user = user;
  uiContext.state.register.meta = buildRegisterUserMeta();

  uiContext.logger?.info('Register test user prepared', {
    email: user.email,
    scenarioTag: uiContext.state.register.meta.scenarioTag,
    sourceFeature: uiContext.state.register.meta.sourceFeature,
  });

  await openSignupLogin({ homePage, loginPage });

  await loginPage.submitNewUserSignup(user.name, user.email);
  await registerPage.fillRequiredAccountDetails(user);
  await registerPage.submitCreateAccount();
  await registerPage.assertAccountCreated();
}

export async function assertLoggedInWithContext({ registerPage, uiContext }) {
  try {
    await registerPage.assertLoggedIn(uiContext.state.register.user?.name);
  } catch (e) {
    throw new Error(
      `Expected logged-in state for user ${uiContext.state.register.user?.email || 'unknown-user'} but it was not visible.`,
      { cause: e }
    );
  }
}

export async function ensureAccountCreatedAndLoggedIn({ homePage, loginPage, registerPage, uiContext }) {
  await createAccountWithUniqueUser({ homePage, loginPage, registerPage, uiContext });
  await registerPage.continueAfterAccountCreated();
  await assertLoggedInWithContext({ registerPage, uiContext });
}

export async function assertDuplicateEmailErrorWithContext({ loginPage, uiContext }) {
  try {
    await loginPage.assertSignupEmailAlreadyExistsError();
  } catch (e) {
    throw new Error(
      `Expected duplicate-email validation for ${uiContext.state.register.user?.email || 'unknown-email'} but message was not visible.`,
      { cause: e }
    );
  }
}
