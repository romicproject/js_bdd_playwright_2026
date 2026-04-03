import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class RegisterPage extends BasePage {
  titleMrRadio() {
    return this.page.locator("#id_gender1");
  }

  titleMrOption() {
    return this.page.getByRole("radio", { name: /^mr\.$/i });
  }

  accountInfoHeading() {
    return this.page.getByRole("heading", {
      name: /enter account information/i,
    });
  }

  accountCreatedHeading() {
    return this.page.getByRole("heading", { name: /account created/i });
  }

  loggedInAsAnyLink() {
    return this.page.getByRole("link", { name: /logged in as/i });
  }

  passwordInput() {
    return this.page.locator('[data-qa="password"]');
  }

  daysSelect() {
    return this.page.locator('[data-qa="days"]');
  }

  monthsSelect() {
    return this.page.locator('[data-qa="months"]');
  }

  yearsSelect() {
    return this.page.locator('[data-qa="years"]');
  }

  firstNameInput() {
    return this.page.locator('[data-qa="first_name"]');
  }

  lastNameInput() {
    return this.page.locator('[data-qa="last_name"]');
  }

  addressInput() {
    return this.page.locator('[data-qa="address"]');
  }

  countrySelect() {
    return this.page.locator('[data-qa="country"]');
  }

  stateInput() {
    return this.page.locator('[data-qa="state"]');
  }

  cityInput() {
    return this.page.locator('[data-qa="city"]');
  }

  zipcodeInput() {
    return this.page.locator('[data-qa="zipcode"]');
  }

  mobileNumberInput() {
    return this.page.locator('[data-qa="mobile_number"]');
  }

  createAccountButton() {
    return this.page.getByRole("button", { name: /create account/i });
  }

  continueButton() {
    return this.page.locator('[data-qa="continue-button"]').first();
  }

  loggedInAsLink(name) {
    return this.page.getByRole("link", {
      name: new RegExp(`logged in as\\s*${name}`, "i"),
    });
  }

  async isVisible(locator, timeout = 1500) {
    return locator.isVisible({ timeout }).catch(() => false);
  }

  async isLoggedInUiVisible(timeout = 1500) {
    const logoutVisible = await this.isVisible(this.logoutLink(), timeout);
    if (logoutVisible) return true;

    return this.isVisible(this.loggedInAsAnyLink(), timeout);
  }

  async settleHomePage() {
    await this.page
      .waitForLoadState("domcontentloaded", { timeout: 3000 })
      .catch(() => {});
    await this.recoverFromVignette("/");
  }

  async openHomeAndSettle() {
    await this.goto("/");
    await this.settleHomePage();
  }

  async ensureMrTitleSelected() {
    const titleRadio = this.titleMrRadio();
    if (await titleRadio.isChecked().catch(() => false)) return;

    const titleOption = this.titleMrOption();
    await expect(titleOption).toBeVisible();

    try {
      await titleOption.check();
    } catch {
      await titleOption.click({ force: true });
    }

    await expect(titleRadio).toBeChecked();
  }

  async assertOnAccountInfoPage() {
    await this.expectUrl(/\/signup$/);
    await expect(this.accountInfoHeading()).toBeVisible();
  }

  async fillRequiredAccountDetails(user) {
    await this.assertOnAccountInfoPage();

    await this.ensureMrTitleSelected();
    await this.passwordInput().fill(user.password);
    await this.daysSelect().selectOption("10");
    await this.monthsSelect().selectOption("5");
    await this.yearsSelect().selectOption("1992");

    await this.fillAfterScroll(this.firstNameInput(), user.firstName);
    await this.lastNameInput().fill(user.lastName);

    await this.fillAfterScroll(this.addressInput(), user.address);
    await this.selectAfterScroll(this.countrySelect(), "Canada");
    await this.fillAfterScroll(this.stateInput(), user.state);
    await this.fillAfterScroll(this.cityInput(), user.city);
    await this.fillAfterScroll(this.zipcodeInput(), user.zipcode);
    await this.fillAfterScroll(this.mobileNumberInput(), user.mobileNumber);
  }

  async submitCreateAccount() {
    await this.createAccountButton().click();
  }

  async assertAccountCreated() {
    await this.expectUrl(/\/account_created(?:\?|$)/);
    await expect(this.accountCreatedHeading()).toBeVisible();
    await expect(this.continueButton()).toBeVisible();
  }

  async continueAfterAccountCreated() {
    const continueButton = this.continueButton();
    await expect(continueButton).toBeVisible();

    // This public demo site is occasionally slow or lands on transient
    // post-continue states, so we re-check the logged-in UI before failing.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt === 0) {
        await this.clickWithFallback(continueButton, {
          timeout: 3000,
          force: true,
          allowDomFallback: true,
        });
      } else {
        await this.openHomeAndSettle();
      }

      if (attempt === 0) {
        await this.settleHomePage();
      }

      const loggedInUiVisible = await this.isLoggedInUiVisible(2500);
      if (loggedInUiVisible) {
        await expect(this.logoutLink()).toBeVisible({ timeout: 5000 });
        return;
      }

      const continueStillVisible = await this.isVisible(
        this.continueButton(),
        1000,
      );
      if (continueStillVisible) {
        continue;
      }
    }

    await this.openHomeAndSettle();
    await expect(this.logoutLink()).toBeVisible({ timeout: 7000 });
  }

  logoutLink() {
    return this.page.getByRole("link", { name: /logout/i });
  }

  async assertLoggedIn(name) {
    if (!(await this.isVisible(this.logoutLink(), 2500))) {
      await this.openHomeAndSettle();
    }

    await expect(this.logoutLink()).toBeVisible({ timeout: 7000 });

    const loggedInVisible = await this.isVisible(this.loggedInAsAnyLink());
    if (loggedInVisible && name) {
      await expect(this.loggedInAsLink(name)).toBeVisible();
    }
  }
}
