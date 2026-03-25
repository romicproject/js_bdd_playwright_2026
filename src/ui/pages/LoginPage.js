import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  signupForm() {
    return this.page.locator('form[action="/signup"]');
  }

  heading() {
    return this.getByRole('heading', { name: /login to your account/i });
  }

  newUserSignupHeading() {
    return this.getByRole('heading', { name: /new user signup/i });
  }

  signupNameInput() {
    return this.getByPlaceholder('Name');
  }

  signupEmailInput() {
    return this.signupForm().getByPlaceholder('Email Address');
  }

  signupButton() {
    return this.getByRole('button', { name: /signup/i });
  }

  signupEmailExistsError() {
    return this.page.getByText(/email address already exist/i).first();
  }

  async assertOnLoginPage() {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await this.goto('/login');
      }

      await this.recoverFromVignette('/login');
      const forbidden = await this.isForbiddenPage();
      if (forbidden) {
        continue;
      }

      await this.expectUrl(/\/login(?:\?|$)/);
      await expect(this.heading()).toBeVisible();
      await expect(this.newUserSignupHeading()).toBeVisible();
      return;
    }

    await this.ensureNotForbidden('open login page');
    await this.expectUrl(/\/login(?:\?|$)/);
    await expect(this.heading()).toBeVisible();
    await expect(this.newUserSignupHeading()).toBeVisible();
  }

  async submitNewUserSignup(name, email) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await this.goto('/login');
        await this.assertOnLoginPage();
      }

      await expect(this.newUserSignupHeading()).toBeVisible();
      await this.signupNameInput().fill(name);
      await this.signupEmailInput().fill(email);
      await this.signupButton().click();

      await this.recoverFromVignette('/login');
      const forbidden = await this.isForbiddenPage();
      if (!forbidden) {
        return;
      }
    }

    await this.ensureNotForbidden('signup submit');
  }

  async assertSignupEmailAlreadyExistsError() {
    await expect(this.signupForm()).toBeVisible();
    await expect(this.signupEmailExistsError()).toContainText(/email address already exist/i);
  }
}
