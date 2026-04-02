import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class ContactUsPage extends BasePage {
  heading() {
    return this.page.getByRole("heading", { name: /get in touch/i });
  }

  submitButton() {
    return this.page.getByRole("button", { name: /submit/i });
  }

  async assertOnContactUsPage() {
    await this.expectUrl(/\/contact_us$/);
    await expect(this.heading()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }
}
