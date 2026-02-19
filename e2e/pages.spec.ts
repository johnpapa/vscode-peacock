import { test, expect } from '@playwright/test';

test.describe('Guide Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/guide/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('loads with correct heading and has substantial content', async ({ page }) => {
    await expect(page.locator('.markdown-section h1').first()).toContainText('Peacock for Visual Studio Code');

    // Check key sections exist
    const content = page.locator('.markdown-section');
    await expect(content.locator('h2', { hasText: 'Overview' })).toBeVisible();
    await expect(content.locator('h2', { hasText: 'Install' })).toBeVisible();
    await expect(content.locator('h2', { hasText: 'Quick Usage' })).toBeVisible();
    await expect(content.locator('h2', { hasText: 'Features' })).toBeVisible();
    await expect(content.locator('h2', { hasText: 'Settings' })).toBeVisible();
  });

  test('has images that load', async ({ page }) => {
    const peacockImg = page.locator('.markdown-section img[src*="peacock-windows"]');
    await expect(peacockImg).toBeVisible();
    // Verify the image element exists and has a valid src attribute
    const src = await peacockImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('peacock-windows');
  });

  test('has settings table', async ({ page }) => {
    const table = page.locator('.markdown-section table').first();
    await expect(table).toBeVisible();

    // Table should have header row and data rows
    const headerCells = table.locator('thead th');
    await expect(headerCells).not.toHaveCount(0);

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe('Changelog Page', () => {
  test('loads with correct heading and has version entries', async ({ page }) => {
    await page.goto('/#/changelog/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page.locator('.markdown-section h1').first()).toContainText('Change Log');

    // Should have version headings (h2 elements with version numbers)
    const versionHeadings = page.locator('.markdown-section h2');
    const count = await versionHeadings.count();
    expect(count).toBeGreaterThan(3);
  });
});

test.describe('About Pages', () => {
  test('history page loads with correct heading', async ({ page }) => {
    await page.goto('/#/about/history', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page.locator('.markdown-section h1').first()).toContainText('About Peacock');
  });

  test('contributing page loads correctly', async ({ page }) => {
    await page.goto('/#/about/contributing', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page.locator('.markdown-section h1').first()).toContainText('Contributing');
  });

  test('code of conduct page loads correctly', async ({ page }) => {
    await page.goto('/#/about/code_of_conduct', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page.locator('.markdown-section h1').first()).toContainText('Code of Conduct');
  });

  test('license page loads with MIT License text', async ({ page }) => {
    await page.goto('/#/about/license', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });

    await expect(page.locator('.markdown-section')).toContainText('MIT License');
  });
});
