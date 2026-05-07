import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.js";
import { config } from "../../framework/config/envConfig.js";

export class ProductsPage extends BasePage {
  allProductsHeading() {
    return this.page.getByRole("heading", { name: /all products/i });
  }

  productsSection() {
    return this.page
      .locator("section")
      .filter({
        has: this.page.getByRole("heading", {
          name: /all products|searched products/i,
        }),
      })
      .first();
  }

  productsContainer() {
    return this.productsSection().locator(".features_items").first();
  }

  searchInput() {
    return this.page.getByPlaceholder("Search Product");
  }

  searchButtonByRole() {
    return this.page.getByRole("button", { name: /search/i });
  }

  searchButtonFallback() {
    return this.page.locator("#submit_search");
  }

  searchButton() {
    return this.searchButtonByRole().or(this.searchButtonFallback()).first();
  }

  searchedProductsHeading() {
    return this.page.getByRole("heading", { name: /searched products/i });
  }

  productCards() {
    return this.productsContainer().locator(".product-image-wrapper");
  }

  productNames() {
    return this.productsContainer().locator(".productinfo p");
  }

  async assertOnProductsPage() {
    await this.expectUrl(/\/products(?:\?|$)/);
    await expect(this.allProductsHeading()).toBeVisible();
    await expect(this.productCards().first()).toBeVisible();
  }

  async searchProduct(term) {
    await this.assertOnProductsPage();
    await this.searchInput().fill(term);
    await expect(this.searchButton()).toBeVisible();
    await this.searchButton().click();
    await expect(this.searchInput()).toHaveValue(term);
  }

  async assertSearchResultsContain(term) {
    const resultsHeadingVisible = await this.searchedProductsHeading()
      .isVisible({ timeout: config.timeout.elementVisibilityExtended })
      .catch(() => false);

    if (!resultsHeadingVisible) {
      const currentNames = await this.productNames().allTextContents();
      const normalizedTerm = term.toLowerCase();
      const hasVisibleMatch = currentNames.some((name) =>
        name.toLowerCase().includes(normalizedTerm),
      );

      expect(
        hasVisibleMatch,
        `Expected searched products related to "${term}", but the page did not show the searched-products heading.`,
      ).toBe(true);
      return;
    }

    await expect(this.searchedProductsHeading()).toBeVisible();
    await expect(this.productCards().first()).toBeVisible();
    await expect(this.productNames().first()).toBeVisible();

    const normalizedTerm = term.toLowerCase();
    const names = await this.productNames().allTextContents();
    const hasMatch = names.some((name) =>
      name.toLowerCase().includes(normalizedTerm),
    );

    expect(hasMatch).toBe(true);
  }
}
