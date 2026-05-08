import { expect } from "@playwright/test";
import { config } from "../../framework/config/envConfig.js";

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async waitForDomContentLoadedQuietly(timeout = config.timeout.recoveryDom) {
    await this.page
      .waitForLoadState("domcontentloaded", {
        timeout,
      })
      .catch(() => {});
  }

  async hasDocumentBody() {
    return this.page
      .locator("body")
      .count()
      .then((count) => count > 0)
      .catch(() => false);
  }

  async restorePath(path, { reload = false } = {}) {
    if (reload && path) {
      await this.goto(path);
    }

    if (path) {
      await this.recoverFromVignette(path);
    }
  }

  async goto(path = "/") {
    try {
      // External pages can remain usable even when Playwright never reaches
      // later load states because ads or third-party assets stall navigation.
      await this.page.goto(path, {
        waitUntil: "commit",
        timeout: config.timeout.navigation,
      });
    } catch (error) {
      if (!this.isNavigationTimeoutError(error)) throw error;

      const recovered = await this.canUsePageAfterNavigationTimeout(path);
      if (!recovered) throw error;
    }
  }

  isNavigationTimeoutError(error) {
    return (
      error instanceof Error &&
      error.message.includes("page.goto:") &&
      error.message.toLowerCase().includes("timeout")
    );
  }

  async canUsePageAfterNavigationTimeout(path) {
    await this.waitForDomContentLoadedQuietly();

    const currentUrl = this.page.url();
    if (!currentUrl || currentUrl === "about:blank") return false;

    if (!(await this.hasDocumentBody())) return false;

    if (path === "/") return true;

    try {
      const expectedUrl = new URL(path, currentUrl).pathname;
      return new URL(currentUrl).pathname === expectedUrl;
    } catch {
      return true;
    }
  }

  async expectUrl(expected) {
    await expect(this.page).toHaveURL(expected);
  }

  async expectTitle(expected) {
    await expect(this.page).toHaveTitle(expected);
  }

  async clickWithFallback(locator, options = {}) {
    const {
      timeout = config.timeout.click,
      force = false,
      scroll = false,
      allowDomFallback = false,
    } = options;

    if (scroll) {
      await locator.scrollIntoViewIfNeeded();
    }

    try {
      await locator.click({ timeout, force });
    } catch (error) {
      if (!allowDomFallback) {
        throw error;
      }

      await locator.evaluate((node) => node.click());
    }
  }

  async fillAfterScroll(locator, value) {
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
  }

  async selectAfterScroll(locator, value) {
    await locator.scrollIntoViewIfNeeded();
    await locator.selectOption(value);
  }

  async recoverFromVignette(path = "/") {
    if (this.page.url().includes("#google_vignette")) {
      await this.goto(path);
    }
  }

  async verifyPageReady({ path, attempts = 2, contextMessage, verify }) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      await this.restorePath(path, { reload: attempt > 0 });

      if (await this.isForbiddenPage()) {
        continue;
      }

      await verify();
      return;
    }

    await this.ensureNotForbidden(contextMessage);
    await verify();
  }

  forbiddenHeading() {
    return this.page.getByRole("heading", { name: /forbidden/i });
  }

  async isForbiddenPage() {
    return this.forbiddenHeading()
      .isVisible({ timeout: config.timeout.elementVisibility })
      .catch(() => false);
  }

  async ensureNotForbidden(contextMessage = "navigation flow") {
    const forbidden = await this.isForbiddenPage();
    if (!forbidden) return;

    throw new Error(
      `External site instability detected during ${contextMessage}: received Forbidden (403).`,
    );
  }

  // ========== Consolidated Helper Methods ==========

  /**
   * Get element by role and wait for it to be visible
   * Reduces repetitive getByRole + visibility checks
   */
  async getByRoleAndWait(
    role,
    name,
    timeout = config.timeout.elementVisibility,
  ) {
    const locator = this.page.getByRole(role, { name });
    await locator.waitFor({ state: "visible", timeout });
    return locator;
  }

  /**
   * Click element and validate navigation to expected URL
   * Combines click + URL validation in one method
   */
  async clickAndValidateNavigation(locator, expectedUrlPattern) {
    await locator.click({ timeout: config.timeout.click });
    await expect(this.page).toHaveURL(expectedUrlPattern, {
      timeout: config.timeout.navigation,
    });
  }

  /**
   * Fill input field and validate value was set
   * Ensures input is ready before and after typing
   */
  async fillAndValidate(locator, value) {
    await locator.waitFor({ state: "attached", timeout: config.timeout.click });
    await locator.fill(value);
    await expect(locator).toHaveValue(value, {
      timeout: config.timeout.elementVisibility,
    });
  }

  /**
   * Validate page URL and title match expected values
   * Common assertion pattern
   */
  async expectUrlAndTitle(expectedUrl, expectedTitle) {
    await expect(this.page).toHaveURL(expectedUrl, {
      timeout: config.timeout.navigation,
    });
    await expect(this.page).toHaveTitle(expectedTitle, {
      timeout: config.timeout.elementVisibility,
    });
  }

  /**
   * Check if element is visible with timeout, return boolean
   * Safe visibility check without throwing
   */
  async isElementVisible(locator, timeout = config.timeout.elementVisibility) {
    return locator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Click element with retry logic for flaky interactions
   * Useful for unstable third-party sites
   */
  async clickWithRetry(
    locator,
    maxAttempts = 3,
    timeout = config.timeout.click,
  ) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await locator.click({ timeout });
        return;
      } catch (error) {
        if (attempt === maxAttempts - 1) throw error;
        await this.page.waitForTimeout(config.timeout.loadState);
      }
    }
  }
}
