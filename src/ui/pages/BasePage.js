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
}
