const { test, expect } = require('@playwright/test');

// Administrator-run, GET-only coverage. No database fixtures or record writes.
for (const entity of ['HA', 'WESCAM_HA']) {
  test(`${entity}: list criteria persist, clear, and survive browser navigation`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        writes.push(route.request().method());
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    const previewResponse = await page.request.get(`/api/compiler/entities/${entity}/preview`);
    expect(previewResponse.status()).toBe(200);
    const preview = await previewResponse.json();
    const available = preview.gui.generatedFields;
    const filter = available.find(f => f.filterable && /^(string|char|varchar|text)/i.test(f.formatSpec ?? ''));
    expect(filter).toBeTruthy();
    const configured = preview.behavior?.defaultSearchColumns ?? [];
    const searchable = available.some(f => f.searchable && configured.includes(f.columnName) && /^(string|char|varchar|text)/i.test(f.formatSpec ?? ''));
    const path = `/lsar/entities/${entity}`;
    await page.goto(path);
    const controls = page.getByRole('form', { name: 'List search and filters' });
    await expect(controls).toBeVisible();
    // Only active filters have inputs, regardless of physical field count.
    await expect(controls.locator('input')).toHaveCount(searchable ? 1 : 0);
    if (searchable) await controls.getByLabel('Search', { exact: true }).fill('OSLAR_LIST_PROBE_NO_MATCH');
    await controls.locator('summary').click();
    await controls.getByLabel('Filter field', { exact: true }).selectOption(filter.columnName);
    await controls.getByRole('button', { name: 'Add filter', exact: true }).click();
    await controls.getByLabel(filter.label, { exact: true }).fill('OSLAR_FILTER_PROBE_NO_MATCH');
    await controls.getByRole('button', { name: 'Apply search and filters' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get(`filter.${filter.columnName}`)).toBe('OSLAR_FILTER_PROBE_NO_MATCH');
    expect(new URL(page.url()).searchParams.has('page')).toBe(false);
    if (searchable) expect(new URL(page.url()).searchParams.get('q')).toBe('OSLAR_LIST_PROBE_NO_MATCH');
    await expect(page.getByText('No records found.', { exact: true })).toBeVisible();
    const bookmark = page.url();
    await page.reload();
    await expect(controls.getByLabel(filter.label, { exact: true })).toHaveValue('OSLAR_FILTER_PROBE_NO_MATCH');
    await controls.getByRole('link', { name: 'Clear search and filters' }).click();
    await expect.poll(() => new URL(page.url()).search).toBe('');
    // Clear uses a normal GET link, preserving browser history.
    await page.goBack();
    await expect.poll(() => page.url()).toBe(bookmark);
    await expect(controls.getByLabel(filter.label, { exact: true })).toHaveValue('OSLAR_FILTER_PROBE_NO_MATCH');
    await page.goForward();
    await expect.poll(() => new URL(page.url()).search).toBe('');
    await page.goto(`${path}?filter.NOT_A_COMPILER_FIELD=attack&page=invalid`);
    await expect.poll(() => new URL(page.url()).search).toBe('');
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}
