const { test, expect } = require('@playwright/test');

test('inspect XA interface', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error')
      consoleErrors.push(msg.text());
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('\nOpening XA...');

  const response = await page.goto('/lsar/entities/XA', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  console.log('HTTP status:', response ? response.status() : 'no response');
  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());

  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);

  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(1000);

  const bodyText = await page.locator('body').innerText();

  console.log('\n----- VISIBLE PAGE TEXT -----');
  console.log(bodyText.slice(0, 8000));
  console.log('----- END PAGE TEXT -----\n');

  const links = await page.locator('a').evaluateAll(as =>
    as.map(a => ({
      text: (a.innerText || '').trim(),
      href: a.getAttribute('href')
    }))
  );

  const buttons = await page.locator('button').evaluateAll(bs =>
    bs.map(b => (b.innerText || '').trim())
  );

  console.log('----- LINKS -----');
  console.log(JSON.stringify(links, null, 2));

  console.log('----- BUTTONS -----');
  console.log(JSON.stringify(buttons, null, 2));

  console.log('Inputs:', await page.locator('input').count());
  console.log('Selects:', await page.locator('select').count());
  console.log('Tables:', await page.locator('table').count());

  console.log('Console errors:', consoleErrors.length);
  console.log('Page errors:', pageErrors.length);

  if (consoleErrors.length) {
    console.log('\nBrowser console errors:');
    consoleErrors.forEach(e => console.log('  -', e));
  }

  if (pageErrors.length) {
    console.log('\nJavaScript page errors:');
    pageErrors.forEach(e => console.log('  -', e));
  }

  await page.screenshot({
    path: 'test-results/xa-page.png',
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
});
