const { test, expect } = require('@playwright/test');

test('OSLAR development site loads successfully', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('Opening OSLAR DEV...');

  const response = await page.goto('/', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  console.log('HTTP status:', response ? response.status() : 'no response');
  console.log('URL:', page.url());

  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(page.locator('body')).toBeVisible();

  console.log('Page title:', await page.title());
  console.log('Console errors:', consoleErrors.length);
  console.log('Page errors:', pageErrors.length);

  if (consoleErrors.length) {
    console.log('Browser console errors:');
    consoleErrors.forEach(error => console.log('  -', error));
  }

  if (pageErrors.length) {
    console.log('JavaScript page errors:');
    pageErrors.forEach(error => console.log('  -', error));
  }

  await page.screenshot({
    path: 'test-results/oslar-home.png',
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
});
