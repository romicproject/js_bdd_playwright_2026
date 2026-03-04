import { expect } from '@playwright/test';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async expectUrl(expected) {
    await expect(this.page).toHaveURL(expected);
  }

  async expectTitle(expected) {
    await expect(this.page).toHaveTitle(expected);
  }

  async recoverFromVignette(path = '/') {
    if (this.page.url().includes('#google_vignette')) {
      await this.goto(path);
    }
  }

  forbiddenHeading() {
    return this.getByRole('heading', { name: /forbidden/i });
  }

  async isForbiddenPage() {
    return this.forbiddenHeading().isVisible({ timeout: 1500 }).catch(() => false);
  }

  async ensureNotForbidden(contextMessage = 'navigation flow') {
    const forbidden = await this.isForbiddenPage();
    if (!forbidden) return;

    throw new Error(
      `External site instability detected during ${contextMessage}: received Forbidden (403).`
    );
  }

  getByRole(role, options) {
    return this.page.getByRole(role, options);
  }

  getByLabel(label, options) {
    return this.page.getByLabel(label, options);
  }

  getByPlaceholder(placeholder, options) {
    return this.page.getByPlaceholder(placeholder, options);
  }

  getByTestId(testId) {
    return this.page.getByTestId(testId);
  }
}