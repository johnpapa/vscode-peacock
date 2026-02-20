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

test.describe('Internal navigation links work', () => {
  test('sidebar links navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    
    const sidebarLinks = [
      { text: 'Guide', expectedHash: '#/guide/' },
      { text: 'Changelog', expectedHash: '#/changelog/' },
      { text: 'About Peacock', expectedHash: '#/about/history' },
      { text: 'Contributing', expectedHash: '#/about/contributing' },
      { text: 'Code of Conduct', expectedHash: '#/about/code_of_conduct' },
      { text: 'License', expectedHash: '#/about/license' },
    ];
    
    for (const link of sidebarLinks) {
      // Use href-based selector to avoid strict mode violations when
      // link text matches both sidebar links and sub-heading anchors
      await page.locator(`.sidebar-nav a[href="${link.expectedHash}"]`).click();
      await page.locator('.markdown-section h1, .markdown-section h2').first().waitFor({ timeout: 10000 });
      const hash = new URL(page.url()).hash;
      expect(hash, `Sidebar link "${link.text}" should navigate to ${link.expectedHash}`).toContain(link.expectedHash.replace('#/', ''));
      // Verify content loaded (not empty)
      const content = await page.locator('.markdown-section').textContent();
      expect(content!.length, `Page for "${link.text}" should have content`).toBeGreaterThan(50);
    }
  });

  test('homepage "Get Started" link works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.markdown-section a:has-text("Get Started")').click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 10000 });
    expect(page.url()).toContain('#/guide/');
  });
  
  test('navbar links navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    
    // Click Guide in navbar
    await page.locator('.app-nav a:has-text("Guide")').click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 10000 });
    expect(page.url()).toContain('#/guide/');
    
    // Click Changelog in navbar
    await page.locator('.app-nav a:has-text("Changelog")').click();
    await page.locator('.markdown-section h1').waitFor({ timeout: 10000 });
    expect(page.url()).toContain('#/changelog/');
  });
});

test.describe('Internal links within content work', () => {
  for (const p of docPages) {
    test(`all internal links on ${p.name} page resolve`, async ({ page }) => {
      await page.goto(p.url);
      await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
      
      // Get all internal links (hash-based or relative)
      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('.markdown-section a');
        const internal: string[] = [];
        anchors.forEach(a => {
          const href = a.getAttribute('href');
          if (!href) return;
          // Internal links: hash links, relative links, or same-origin links
          if (href.startsWith('#/') || href.startsWith('/') || 
              (!href.startsWith('http') && !href.startsWith('mailto:'))) {
            internal.push(href);
          }
        });
        return [...new Set(internal)]; // deduplicate
      });
      
      for (const href of links) {
        // Skip anchor-only links (#section-name within the same page)
        if (href.startsWith('#') && !href.startsWith('#/')) continue;
        
        // Navigate to the link
        const fullUrl = href.startsWith('#/') ? `/${href}` : href;
        const response = await page.goto(fullUrl);
        // For hash routes, the page itself always returns 200, 
        // so check that markdown content renders
        await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 10000 });
        // Wait for Docsify to finish rendering (content > 20 chars, not just "Loading…")
        await page.waitForFunction(
          () => (document.querySelector('.markdown-section')?.textContent?.length ?? 0) > 20,
          { timeout: 15000 }
        );
      }
    });
  }
});

test.describe('External links have valid URLs', () => {
  test('guide page external links are well-formed', async ({ page }) => {
    await page.goto('/#/guide/');
    await page.locator('.markdown-section').waitFor({ state: 'visible', timeout: 15000 });
    
    const externalLinks = await page.evaluate(() => {
      const anchors = document.querySelectorAll('.markdown-section a');
      const external: { href: string; text: string }[] = [];
      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('http')) {
          external.push({ href, text: a.textContent?.trim().substring(0, 40) || '' });
        }
      });
      return external;
    });
    
    // Verify all external links are well-formed URLs
    for (const link of externalLinks) {
      expect(() => new URL(link.href), `Link "${link.text}" has invalid URL: ${link.href}`).not.toThrow();
    }
    
    // There should be external links on the guide page
    expect(externalLinks.length).toBeGreaterThan(5);
  });
});
