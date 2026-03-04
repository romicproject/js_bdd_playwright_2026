import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class RegisterPage extends BasePage {
    accountInfoHeading() {
        return this.getByRole('heading', { name: /enter account information/i });
    }

    accountCreatedHeading() {
        return this.getByRole('heading', { name: /account created/i });
    }

    loggedInAsAnyLink() {
        return this.getByRole('link', { name: /logged in as/i });
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
        return this.getByRole('button', { name: /create account/i });
    }

    continueButton() {
        return this.page.locator('[data-qa="continue-button"]');
    }

    loggedInAsLink(name) {
        return this.getByRole('link', { name: new RegExp(`logged in as\\s*${name}`, 'i') });
    }

    async assertOnAccountInfoPage() {
        await this.expectUrl(/\/signup$/);
        await expect(this.accountInfoHeading()).toBeVisible();
    }

    async fillRequiredAccountDetails(user) {
        await this.assertOnAccountInfoPage();

        await this.getByLabel(/mr\./i).check();
        await this.passwordInput().fill(user.password);
        await this.daysSelect().selectOption('10');
        await this.monthsSelect().selectOption('5');
        await this.yearsSelect().selectOption('1992');

        await this.firstNameInput().scrollIntoViewIfNeeded();
        await this.firstNameInput().fill(user.firstName);
        await this.lastNameInput().fill(user.lastName);

        await this.addressInput().scrollIntoViewIfNeeded();
        await this.addressInput().fill(user.address);

        await this.countrySelect().scrollIntoViewIfNeeded();
        await this.countrySelect().selectOption('Canada');

        await this.stateInput().scrollIntoViewIfNeeded();
        await this.stateInput().fill(user.state);

        await this.cityInput().scrollIntoViewIfNeeded();
        await this.cityInput().fill(user.city);

        await this.zipcodeInput().scrollIntoViewIfNeeded();
        await this.zipcodeInput().fill(user.zipcode);

        await this.mobileNumberInput().scrollIntoViewIfNeeded();
        await this.mobileNumberInput().fill(user.mobileNumber);
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
        await this.continueButton().click();
        await this.recoverFromVignette('/');
        await expect(this.getByRole('link', { name: /logout/i })).toBeVisible();
    }

    logoutLink() {
        return this.getByRole('link', { name: /logout/i });
    }

    async assertLoggedIn(name) {
        await expect(this.logoutLink()).toBeVisible();

        const loggedInVisible = await this.loggedInAsAnyLink().isVisible({ timeout: 1500 }).catch(() => false);
        if (loggedInVisible && name) {
            await expect(this.loggedInAsLink(name)).toBeVisible();
        }
    }
}
