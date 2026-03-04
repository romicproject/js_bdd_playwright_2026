import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/ui/ui.fixtures.js';

const { Given, When, Then } = createBdd(test);

Given('I open the AutomationExercise home page', async ({ homePage }) => {
  await homePage.open();
  await expect(homePage.signupLoginLink()).toBeVisible();
});

When('I navigate to the Signup Login page', async ({ homePage }) => {
  await homePage.clickSignupLogin();
});

Then('I should see the login heading and the signup URL', async ({ loginPage }) => {
  await loginPage.assertOnLoginPage();
});
