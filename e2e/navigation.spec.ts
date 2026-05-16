import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('sidebar is visible and contains expected links', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const sidebarNav = page.locator('.sidebar-nav');
    await expect(sidebarNav).toBeVisible();

    await expect(sidebarNav.locator('a', { hasText: 'Home' })).toBeVisible();
    await expect(sidebarNav.locator('a', { hasText: 'Guide' })).toBeVisible();
    await expect(sidebarNav.locator('a', { hasText: 'Changelog' })).toBeVisible();
  });

  test('sidebar has About section with sub-items', async ({ page }) => {
    const sidebarNav = page.locator('.sidebar-nav');

    await expect(sidebarNav.locator('a', { hasText: 'About Peacock' })).toBeVisible();
    await expect(sidebarNav.locator('a', { hasText: 'Contributing' })).toBeVisible();
    await expect(sidebarNav.locator('a', { hasText: 'Code of Conduct' })).toBeVisible();
    await expect(sidebarNav.locator('a', { hasText: 'License' })).toBeVisible();
  });

  test('clicking Guide navigates to guide page', async ({ page }) => {
    await page.locator('.sidebar-nav a', { hasText: 'Guide' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page).toHaveURL(/#\/guide\//);
    await expect(page.locator('.markdown-section h1').first()).toContainText('Peacock for Visual Studio Code');
  });

  test('clicking Changelog navigates to changelog page', async ({ page }) => {
    await page.locator('.sidebar-nav a', { hasText: 'Changelog' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page).toHaveURL(/#\/changelog\//);
    await expect(page.locator('.markdown-section h1').first()).toContainText('Change Log');
  });

  test('clicking About sub-items loads correct pages', async ({ page }) => {
    // About Peacock
    await page.locator('.sidebar-nav a', { hasText: 'About Peacock' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/about\/history/);
    await expect(page.locator('.markdown-section h1').first()).toContainText('About Peacock');

    // Contributing
    await page.locator('.sidebar-nav a', { hasText: 'Contributing' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/about\/contributing/);
    await expect(page.locator('.markdown-section h1').first()).toContainText('Contributing');

    // Code of Conduct — use exact title to avoid matching the auto-generated sub-heading link
    await page.locator('.sidebar-nav a[title="Code of Conduct"]').click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/about\/code_of_conduct/);
    await expect(page.locator('.markdown-section h1').first()).toContainText('Code of Conduct');

    // License — no h1 heading, wait for content instead
    await page.locator('.sidebar-nav a', { hasText: 'License' }).click();
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    await expect(page).toHaveURL(/#\/about\/license/);
  });
});

test.describe('Navbar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('navbar is present with links', async ({ page }) => {
    const navbar = page.locator('.app-nav');
    await expect(navbar).toBeVisible();

    await expect(navbar.locator('a')).not.toHaveCount(0);
  });

  test('clicking a navbar link navigates correctly', async ({ page }) => {
    await page.locator('.app-nav a', { hasText: 'Guide' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    await expect(page).toHaveURL(/#\/guide\//);
  });
});

test.describe('Browser History Navigation', () => {
  test('back/forward navigation works with hash routing', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    // Navigate to Guide
    await page.locator('.sidebar-nav a', { hasText: 'Guide' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/guide\//);

    // Navigate to Changelog
    await page.locator('.sidebar-nav a', { hasText: 'Changelog' }).click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/changelog\//);

    // Go back to Guide
    await page.goBack();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/guide\//);

    // Go forward to Changelog
    await page.goForward();
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/changelog\//);
  });
});
