import { createBdd } from "playwright-bdd";
import { test } from "../../fixtures/api/api.fixtures.js";
import {
  createUserFromTable,
  ensureUserExists,
  verifyLoginFromTable,
  verifyLoginWithCreatedUser,
  verifyLoginWithSavedUser,
  deleteAccountWithCredentials,
  deleteAccountWithSavedUser,
  getUserDetailByEmail,
  getUserDetailBySavedUser,
  saveCreatedUser,
} from "../../support/api/users.flow.js";

const { Given, When, Then } = createBdd(test);

// ----------------------
// CREATE USER
// ----------------------
When("I create a user with:", createUserFromTable);

// ----------------------
// GIVEN USER EXISTS (setup-only)
// ----------------------
Given(
  "a user exists with email {string} and password {string}",
  async ({ apiContext, apiHelpers }, email, password) => {
    await ensureUserExists(
      { apiContext, apiHelpers },
      {
        email,
        password,
      },
    );
  },
);

Given(
  "a user exists with email {string}",
  async ({ apiContext, apiHelpers }, email) => {
    await ensureUserExists(
      { apiContext, apiHelpers },
      {
        email,
        password: "Delete123!",
        saveAsCurrent: true,
      },
    );
  },
);

// ----------------------
// LOGIN
// ----------------------
When("I verify login with:", verifyLoginFromTable);

When(
  "I verify login with the created user credentials",
  verifyLoginWithCreatedUser,
);

When(
  "I verify login with the saved user credentials",
  verifyLoginWithSavedUser,
);

// ----------------------
// DELETE (atomic)
// ----------------------
When(
  "I delete account with email {string} and password {string}",
  deleteAccountWithCredentials,
);

When(
  "I delete account with the saved user credentials",
  deleteAccountWithSavedUser,
);

// ----------------------
// USER DETAIL (atomic) - ACT steps
// ----------------------
When("I get user detail by email {string}", getUserDetailByEmail);

When("I get user detail by the saved user email", getUserDetailBySavedUser);

// ----------------------
// SAVE USER
// ----------------------
Then("I save the created user email", async ({ apiContext }) => {
  saveCreatedUser(apiContext);
});
