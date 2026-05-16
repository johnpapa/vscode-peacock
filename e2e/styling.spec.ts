import { test, expect } from '@playwright/test';

test.describe('CSS Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });
  });

  test('top gradient bar exists with correct height', async ({ page }) => {
    const pseudoHeight = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body, '::before');
      return style.height;
    });
    expect(pseudoHeight).toBe('3px');
  });

  test('top gradient bar has gradient background', async ({ page }) => {
    const background = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body, '::before');
      return style.backgroundImage;
    });
    expect(background).toContain('gradient');
  });

  test('sidebar has correct background color', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const bgColor = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #f8f9fa = rgb(248, 249, 250)
    expect(bgColor).toBe('rgb(248, 249, 250)');
  });

  test('content h1 has green bottom border', async ({ page }) => {
    const h1 = page.locator('.markdown-section h1').first();
    const borderBottom = await h1.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.borderBottomColor;
    });
    // #42b883 = rgb(66, 184, 131)
    expect(borderBottom).toBe('rgb(66, 184, 131)');
  });

  test('links in content area use brand green color', async ({ page }) => {
    // Target a visible hyperlink inside markdown content (not the heading anchor)
    const link = page.locator('.markdown-section p a, .markdown-section li a').first();
    await expect(link).toBeVisible();
    const color = await link.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // #42b883 = rgb(66, 184, 131)
    expect(color).toBe('rgb(66, 184, 131)');
  });

  test('blockquotes have green left border', async ({ page }) => {
    const blockquote = page.locator('.markdown-section blockquote').first();
    const borderColor = await blockquote.evaluate((el) => {
      return window.getComputedStyle(el).borderLeftColor;
    });
    expect(borderColor).toBe('rgb(66, 184, 131)');
  });

  test('page uses Inter font family', async ({ page }) => {
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('images have border-radius applied', async ({ page }) => {
    const img = page.locator('.markdown-section img').first();
    const borderRadius = await img.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toBe('8px');
  });

  test('GitHub corner SVG is present', async ({ page }) => {
    const githubCorner = page.locator('.github-corner svg');
    await expect(githubCorner).toBeVisible();
  });
});

test.describe('Code Block Styling', () => {
  test('code blocks have dark background', async ({ page }) => {
    await page.goto('/#/guide/', { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-section h1').waitFor({ timeout: 15000 });

    const codeBlock = page.locator('.markdown-section pre').first();
    await expect(codeBlock).toBeVisible();
    const bgColor = await codeBlock.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #1e1e2e = rgb(30, 30, 46)
    expect(bgColor).toBe('rgb(30, 30, 46)');
  });
});
