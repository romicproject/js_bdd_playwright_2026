import { expect } from "@playwright/test";

const NAVIGATION_TIMEOUT_MS = 15000;
const RECOVERY_DOM_TIMEOUT_MS = 2000;

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = "/") {
    try {
      // External pages can remain usable even when Playwright never reaches
      // later load states because ads or third-party assets stall navigation.
      await this.page.goto(path, {
        waitUntil: "commit",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    } catch (error) {
      if (!this.isNavigationTimeoutError(error)) throw error;

      const recovered = await this.canRecoverFromNavigationTimeout(path);
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

  async canRecoverFromNavigationTimeout(path) {
    await this.page
      .waitForLoadState("domcontentloaded", {
        timeout: RECOVERY_DOM_TIMEOUT_MS,
      })
      .catch(() => {});

    const currentUrl = this.page.url();
    if (!currentUrl || currentUrl === "about:blank") return false;

    const hasBody = await this.page
      .locator("body")
      .count()
      .then((count) => count > 0)
      .catch(() => false);

    if (!hasBody) return false;

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

  async recoverFromVignette(path = "/") {
    if (this.page.url().includes("#google_vignette")) {
      await this.goto(path);
    }
  }

  forbiddenHeading() {
    return this.getByRole("heading", { name: /forbidden/i });
  }

  async isForbiddenPage() {
    return this.forbiddenHeading()
      .isVisible({ timeout: 1500 })
      .catch(() => false);
  }

  async ensureNotForbidden(contextMessage = "navigation flow") {
    const forbidden = await this.isForbiddenPage();
    if (!forbidden) return;

    throw new Error(
      `External site instability detected during ${contextMessage}: received Forbidden (403).`,
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
