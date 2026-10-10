const { test, expect } = require('@playwright/test');

const entities = ['XA', 'XB', 'CA', 'CB', 'XC', 'HA', 'HG', 'HO'];

for (const entity of entities) {

  test(`${entity} generated form loads correctly`, async ({ page }) => {

    const pageErrors = [];
    const consoleErrors = [];

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error')
        consoleErrors.push(msg.text());
    });

    console.log(`\nTesting ${entity}...`);

    const response = await page.goto(`/lsar/entities/${entity}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);

    await expect(page.locator('body')).toBeVisible();

    await expect(
      page.getByText('Generated form', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Create record' })
    ).toBeVisible();

    const inputs = await page.locator('input').count();
    const selects = await page.locator('select').count();
    const tables = await page.locator('table').count();

    console.log(`HTTP: ${response.status()}`);
    console.log(`Inputs: ${inputs}`);
    console.log(`Selects: ${selects}`);
    console.log(`Tables: ${tables}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (consoleErrors.length) {
      console.log('Console errors:');
      consoleErrors.forEach(e => console.log('  -', e));
    }

    if (pageErrors.length) {
      console.log('Page errors:');
      pageErrors.forEach(e => console.log('  -', e));
    }

    await page.screenshot({
      path: `test-results/${entity.toLowerCase()}-page.png`,
      fullPage: true
    });

    expect(pageErrors).toEqual([]);
  });
}
