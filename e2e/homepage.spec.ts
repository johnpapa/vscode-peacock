import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('page loads with correct title', async ({ page }) => {
    // Docsify dynamically sets the title based on the current page heading
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('main heading "Peacock" is visible', async ({ page }) => {
    await expect(page.locator('.markdown-section h1').first()).toBeVisible();
    await expect(page.locator('.markdown-section h1').first()).toContainText('Peacock');
  });

  test('hero image is visible and loads', async ({ page }) => {
    const heroImg = page.locator('.markdown-section img[src*="hero"]');
    await expect(heroImg).toBeVisible();
    const naturalWidth = await heroImg.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('features section has all 3 items', async ({ page }) => {
    const featuresHeading = page.locator('.markdown-section h2', { hasText: 'Features' });
    await expect(featuresHeading).toBeVisible();

    const featuresList = page.locator('.markdown-section ul').first();
    const items = featuresList.locator('li');
    await expect(items).toHaveCount(3);

    await expect(items.nth(0)).toContainText('Work More Efficiently');
    await expect(items.nth(1)).toContainText('Remote Integration');
    await expect(items.nth(2)).toContainText('Live Share');
  });

  test('quick start section has 4 ordered list items', async ({ page }) => {
    const quickStartHeading = page.locator('.markdown-section h2', { hasText: 'Quick Start' });
    await expect(quickStartHeading).toBeVisible();

    const orderedList = page.locator('.markdown-section ol');
    const items = orderedList.locator('li');
    await expect(items).toHaveCount(4);
  });

  test('get started link is present and points to guide', async ({ page }) => {
    const link = page.locator('.markdown-section a', { hasText: 'Get Started' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /guide/);
  });

  test('blockquote description text is visible', async ({ page }) => {
    const blockquote = page.locator('.markdown-section blockquote');
    await expect(blockquote).toBeVisible();
    await expect(blockquote).toContainText('Subtly change the color');
  });
});
