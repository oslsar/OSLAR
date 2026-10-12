const { test, expect } = require('@playwright/test');

// GET-only inspection. Confirmation is cancelled; existing records are never deleted.
for (const entity of ['HA', 'WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF']) {
  test(`${entity}: Delete follows metadata and cancellation sends no write request`, async ({ page }, testInfo) => {
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        writes.push(route.request().method());
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    const response = await page.request.get(`/api/compiler/entities/${entity}/preview`);
    expect(response.status()).toBe(200);
    const preview = await response.json();
    await page.goto(`/lsar/entities/${entity}`);
    const buttons = page.locator('table').getByRole('button', { name: 'Delete', exact: true });
    if (!preview.behavior?.allowDelete) {
      await expect(buttons).toHaveCount(0);
    } else {
      const rows = page.locator('table tbody tr').filter({ has: page.getByRole('button', { name: 'Delete', exact: true }) });
      const count = await rows.count();
      await expect(buttons).toHaveCount(count);
      const empty = await page.getByText('No records found.', { exact: true }).count();
      expect(count > 0 || empty > 0).toBe(true);
      if (count) {
        const dialogPromise = page.waitForEvent('dialog');
        const click = buttons.first().click();
        const dialog = await dialogPromise;
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('This action cannot be undone.');
        await dialog.dismiss();
        await click;
        await expect(buttons.first()).toBeEnabled();
      } else {
        testInfo.annotations.push({ type: 'coverage limitation', description: 'No existing rows; cancellation inspected only for populated entities.' });
      }
    }
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
