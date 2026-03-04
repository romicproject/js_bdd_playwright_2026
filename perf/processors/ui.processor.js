export async function criticalJourney(page, vuContext) {
  const baseUrl = vuContext?.vars?.targetUi || process.env.BASE_URL || 'https://automationexercise.com';

  await page.goto(baseUrl);

  await page.getByRole('link', { name: /products/i }).click();
  await page.waitForURL(/\/products/);

  const searchInput = page.getByPlaceholder(/search product/i);
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('Dress');

  const searchButtonByRole = page.getByRole('button', { name: /search/i });
  if (await searchButtonByRole.count()) {
    await searchButtonByRole.first().click();
  } else {
    await page.locator('#submit_search').click();
  }

  await page.getByRole('heading', { name: /searched products/i }).waitFor({ state: 'visible' });
}
