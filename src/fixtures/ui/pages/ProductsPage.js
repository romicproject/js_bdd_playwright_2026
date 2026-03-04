import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ProductsPage extends BasePage {
  allProductsHeading() {
    return this.getByRole('heading', { name: /all products/i });
  }

  productsSection() {
    return this.page
      .locator('section')
      .filter({
        has: this.getByRole('heading', { name: /all products|searched products/i }),
      })
      .first();
  }

  productsContainer() {
    return this.productsSection().locator('.features_items').first();
  }

  searchInput() {
    return this.page.getByPlaceholder('Search Product');
  }

  searchButtonByRole() {
    return this.getByRole('button', { name: /search/i });
  }

  searchButtonFallback() {
    return this.page.locator('#submit_search');
  }

  searchedProductsHeading() {
    return this.getByRole('heading', { name: /searched products/i });
  }

  productCards() {
    return this.productsContainer().locator('.product-image-wrapper');
  }

  productNames() {
    return this.productsContainer().locator('.productinfo p');
  }

  async assertOnProductsPage() {
    await this.expectUrl(/\/products(?:\?|$)/);
    await expect(this.allProductsHeading()).toBeVisible();
    await expect(this.productCards().first()).toBeVisible();
  }

  async searchProduct(term) {
    await this.assertOnProductsPage();
    await this.searchInput().fill(term);
    try {
      await this.searchButtonByRole().click();
    } catch (e) {
      await this.searchButtonFallback().click();
    }
  }

  async assertSearchResultsContain(term) {
    await expect(this.searchedProductsHeading()).toBeVisible();
    await expect(this.productCards().first()).toBeVisible();
    await expect(this.productNames().first()).toBeVisible();

    const normalizedTerm = term.toLowerCase();
    const names = await this.productNames().allTextContents();
    const hasMatch = names.some((name) => name.toLowerCase().includes(normalizedTerm));

    expect(hasMatch).toBe(true);
  }
}
