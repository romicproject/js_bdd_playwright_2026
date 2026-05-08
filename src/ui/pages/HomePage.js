import { BasePage } from "./BasePage.js";
import { config } from "../../framework/config/envConfig.js";
import { expect } from "@playwright/test";

export class HomePage extends BasePage {
  navLinkByName(name) {
    return this.page
      .getByRole("banner")
      .getByRole("link", { name: new RegExp(name, "i") });
  }

  async open() {
    await this.goto("/");
    await this.assertOnHomePage();
  }

  signupLoginLink() {
    return this.page.getByRole("link", { name: /signup\s*\/\s*login/i });
  }

  async clickSignupLogin() {
    const signupLoginLink = this.signupLoginLink();
    await expect(signupLoginLink).toBeVisible();
    await signupLoginLink.scrollIntoViewIfNeeded();

    try {
      await signupLoginLink.click({ timeout: config.timeout.loadState });
    } catch {
      await this.goto("/login");
    }

    await this.recoverFromVignette("/login");
  }

  async clickTopNavigation(name) {
    await this.assertOnHomePage();

    const navLink = this.navLinkByName(name);
    await expect(navLink).toBeVisible();
    const href = await navLink.getAttribute("href");
    await navLink.scrollIntoViewIfNeeded();

    try {
      await navLink.click({ timeout: config.timeout.loadState });
    } catch {
      if (!href)
        throw new Error(
          `[UI_PAGE] Missing href for top navigation link "${name}"`,
        );
      await this.goto(href);
    }

    if (href) {
      await this.recoverFromVignette(href);

      if (href === "/logout" && this.page.url().includes("/logout")) {
        await this.goto("/login");
        await this.recoverFromVignette("/login");
      }
    }
  }

  async assertOnHomePage() {
    await this.verifyPageReady({
      path: "/",
      contextMessage: "open home page",
      verify: async () => {
        await this.expectUrl(/\/(?:\?|$)/);
        await expect(this.navLinkByName("Home")).toBeVisible();
      },
    });
  }
}
