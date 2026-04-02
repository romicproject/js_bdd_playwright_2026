import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class LoginPage extends BasePage {
  signupForm() {
    return this.page.locator('form[action="/signup"]');
  }

  heading() {
    return this.page.getByRole("heading", { name: /login to your account/i });
  }

  newUserSignupHeading() {
    return this.page.getByRole("heading", { name: /new user signup/i });
  }

  signupNameInput() {
    return this.page.getByPlaceholder("Name");
  }

  signupEmailInput() {
    return this.signupForm().getByPlaceholder("Email Address");
  }

  signupButton() {
    return this.page.getByRole("button", { name: /signup/i });
  }

  signupEmailExistsError() {
    return this.signupForm()
      .locator("p")
      .filter({ hasText: /email address already exist/i })
      .first();
  }

  async assertOnLoginPage() {
    await this.verifyPageReady({
      path: "/login",
      contextMessage: "open login page",
      verify: async () => {
        await this.expectUrl(/\/login(?:\?|$)/);
        await expect(this.heading()).toBeVisible();
        await expect(this.newUserSignupHeading()).toBeVisible();
      },
    });
  }

  async submitNewUserSignup(name, email) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await this.goto("/login");
        await this.assertOnLoginPage();
      }

      await expect(this.newUserSignupHeading()).toBeVisible();
      await this.signupNameInput().fill(name);
      await this.signupEmailInput().fill(email);
      const signupButton = this.signupButton();
      await expect(signupButton).toBeVisible();
      await this.clickWithFallback(signupButton, {
        timeout: 3000,
        scroll: true,
        allowDomFallback: true,
      });

      await this.recoverFromVignette("/login");
      const forbidden = await this.isForbiddenPage();
      if (!forbidden) {
        return;
      }
    }

    await this.ensureNotForbidden("signup submit");
  }

  async assertSignupEmailAlreadyExistsError() {
    await expect(this.signupForm()).toBeVisible();
    await expect(this.signupEmailExistsError()).toContainText(
      /email address already exist/i,
    );
  }
}
