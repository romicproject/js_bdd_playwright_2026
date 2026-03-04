import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/ui/ui.fixtures.js';

const { When, Then } = createBdd(test);

When('I navigate to the {string} page from home', async ({ homePage }, navItem) => {
  await homePage.clickTopNavigation(navItem);
});

Then('I should see the Contact Us heading and URL', async ({ contactUsPage }) => {
  await contactUsPage.assertOnContactUsPage();
});

Then('I should see the products list and URL', async ({ productsPage }) => {
  await productsPage.assertOnProductsPage();
});

When('I search for UI product {string}', async ({ productsPage }, searchTerm) => {
  await productsPage.searchProduct(searchTerm);
});

Then('I should see searched products related to {string}', async ({ productsPage }, searchTerm) => {
  await productsPage.assertSearchResultsContain(searchTerm);
});
