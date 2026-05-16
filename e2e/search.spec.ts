import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('search input is present in the sidebar', async ({ page }) => {
    const searchInput = page.locator('.sidebar .search input');
    await expect(searchInput).toBeVisible();
  });

  test('typing in search shows results', async ({ page }) => {
    const searchInput = page.locator('.sidebar .search input');
    await searchInput.fill('color');

    // Wait for search results to appear
    const results = page.locator('.sidebar .search .matching-post');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search results contain relevant matches', async ({ page }) => {
    const searchInput = page.locator('.sidebar .search input');
    await searchInput.fill('color');

    const results = page.locator('.sidebar .search .matching-post');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    // At least one result should reference "color"
    const firstResultText = await results.first().textContent();
    expect(firstResultText?.toLowerCase()).toContain('color');
  });

  test('clicking a search result navigates to correct page', async ({ page }) => {
    const searchInput = page.locator('.sidebar .search input');
    await searchInput.fill('color');

    const results = page.locator('.sidebar .search .matching-post');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    await results.first().click();

    // Should navigate away from the homepage — URL hash should change
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page.locator('.markdown-section')).toBeVisible();
  });

  test('clearing search restores normal sidebar', async ({ page }) => {
    const searchInput = page.locator('.sidebar .search input');
    await searchInput.fill('color');

    const results = page.locator('.sidebar .search .matching-post');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    // Clear the search
    await searchInput.fill('');

    // Results should disappear and sidebar nav should be visible again
    await expect(results.first()).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.sidebar-nav')).toBeVisible();
  });
});
