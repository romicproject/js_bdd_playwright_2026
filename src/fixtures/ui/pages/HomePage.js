import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class HomePage extends BasePage {
  navLinkByName(name) {
    return this.page
      .getByRole('banner')
      .getByRole('link', { name: new RegExp(name, 'i') });
  }

  async open() {
    await this.goto('/');
    await this.assertOnHomePage();
  }

  signupLoginLink() {
    return this.getByRole('link', { name: /signup\s*\/\s*login/i });
  }

  async clickSignupLogin() {
    await this.signupLoginLink().click();
  }

  async clickTopNavigation(name) {
    await this.assertOnHomePage();

    const navLink = this.navLinkByName(name);
    await expect(navLink).toBeVisible();
    const href = await navLink.getAttribute('href');
    await navLink.click();
    if (href) {
      await this.recoverFromVignette(href);
    }
  }

  async assertOnHomePage() {
    await this.recoverFromVignette('/');
    await this.expectUrl(/\/$/);
    await expect(this.navLinkByName('Home')).toBeVisible();
  }
}
