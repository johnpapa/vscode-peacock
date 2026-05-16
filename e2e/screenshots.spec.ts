import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotDir = path.join('e2e', 'screenshots');

test.describe('Documentation Site Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport for reproducible screenshots
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('homepage', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '01-homepage.png'), fullPage: true });
  });

  test('guide page', async ({ page }) => {
    await page.goto('/#/guide/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotDir, '02-guide.png'), fullPage: true });
  });

  test('guide page - settings table', async ({ page }) => {
    await page.goto('/#/guide/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section table').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);
    // Scroll to the first table
    await page.locator('.markdown-section table').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotDir, '03-guide-table.png') });
  });

  test('changelog page', async ({ page }) => {
    await page.goto('/#/changelog/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '04-changelog.png'), fullPage: false });
  });

  test('about page', async ({ page }) => {
    await page.goto('/#/about/history', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '05-about.png'), fullPage: true });
  });

  test('contributing page', async ({ page }) => {
    await page.goto('/#/about/contributing', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '06-contributing.png'), fullPage: true });
  });

  test('license page', async ({ page }) => {
    await page.goto('/#/about/license', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section').waitFor({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '07-license.png'), fullPage: true });
  });

  test('mobile viewport - homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '08-mobile-homepage.png'), fullPage: true });
  });

  test('search functionality', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    const searchInput = page.locator('.sidebar .search input');
    await searchInput.fill('color');
    // Wait for search results to appear
    await page.locator('.matching-post').first().waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, '09-search.png') });
  });
});
