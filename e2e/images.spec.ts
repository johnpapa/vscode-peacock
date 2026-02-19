import { test, expect } from '@playwright/test';

const docPages = [
  { url: '/', name: 'Homepage' },
  { url: '/#/guide/', name: 'Guide' },
  { url: '/#/changelog/', name: 'Changelog' },
  { url: '/#/about/history', name: 'About' },
  { url: '/#/about/contributing', name: 'Contributing' },
  { url: '/#/about/code_of_conduct', name: 'Code of Conduct' },
  { url: '/#/about/license', name: 'License' },
];

test.describe('Images load correctly on all pages', () => {
  for (const p of docPages) {
    test(`all images render on ${p.name} page`, async ({ page }) => {
      await page.goto(p.url);
      await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('.markdown-section img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        // Wait for image to load
        await expect(img).toHaveJSProperty('complete', true, { timeout: 10000 });
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `Image failed to load: ${src}`).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('Key images exist and load', () => {
  test('homepage hero image loads', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    const heroImg = page.locator('.markdown-section img[src*="hero"]');
    await expect(heroImg).toBeVisible();
    const width = await heroImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(width).toBeGreaterThan(0);
  });

  test('guide page local images all load', async ({ page }) => {
    await page.goto('/#/guide/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Check specific important images
    const expectedImages = [
      'peacock-windows',
      'named-colors',
      'affected-settings',
      'element-adjustments',
      'peacock-live-share-demo',
      'peacock-remote',
      'title-bar-coloring-settings',
      'peacock-sketchnote',
    ];
    
    for (const imgName of expectedImages) {
      const img = page.locator(`.markdown-section img[src*="${imgName}"]`);
      await expect(img, `Image ${imgName} should be present`).toBeAttached({ timeout: 10000 });
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, `Image ${imgName} should have loaded (naturalWidth > 0)`).toBeGreaterThan(0);
    }
  });

  test('sidebar logo image loads', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    const logo = page.locator('.sidebar .app-name-link img, .sidebar img[alt="Peacock"]');
    await expect(logo).toBeVisible();
  });
});
