const { test, expect } = require('@playwright/test');

// Explicit browser baselines, including both compiler-planned HO relationships.
const baselines = {
  XA: { fields: 29, lookups: [] },
  XB: { fields: 14, lookups: ['XA'] },
  CA: { fields: 38, lookups: ['XB', 'CA'] },
  CB: { fields: 18, lookups: ['CA', 'CB'] },
  XC: { fields: 13, lookups: ['XB'] },
  HA: { fields: 68, lookups: ['XA', 'XH'] },
  HG: { fields: 70, lookups: ['XB', 'HA'] },
  HO: { fields: 8, lookups: ['HG', 'XC'] },
};

function fieldCard(page, column) {
  return page.locator('div.rounded-md.border.p-3').filter({
    has: page.locator('div').filter({
      hasText: new RegExp(`^${column}(?: ·|$)`),
    }),
  });
}

for (const [entity, baseline] of Object.entries(baselines)) {
  test(`${entity} controls, lookups and existing edits are read-only inspected`, async ({ page }, testInfo) => {
    const pageErrors = [];
    const consoleErrors = [];
    const blockedWrites = [];
    const lookupEvidence = [];
    let relationshipEvidence = null;
    let editEvidence = 'No existing edit link in the displayed record window.';

    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    // Guard against accidental writes even if a future UI change submits on selection.
    await page.route('**/api/**', async route => {
      const request = route.request();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        blockedWrites.push(`${request.method()} ${request.url()}`);
        await route.abort('blockedbyclient');
      } else {
        await route.continue();
      }
    });

    try {
      const response = await page.goto(`/lsar/entities/${entity}`);
      expect(response.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Generated form', exact: true })).toBeVisible();
      await expect(page.locator('table')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Create record', exact: true })).toBeVisible();

      const previewResponse = await page.request.get(`/api/compiler/entities/${entity}/preview`);
      expect(previewResponse.status()).toBe(200);
      const preview = await previewResponse.json();
      const fields = preview.gui.form.sections.flatMap(section => section.fields);
      expect(fields).toHaveLength(baseline.fields);
      await expect(page.locator('div.rounded-md.border.p-3')).toHaveCount(baseline.fields);
      const lookupFields = fields.filter(field => field.controlType === 'lookup');
      expect(lookupFields.map(field => field.lookup.parentEntityCode)).toEqual(baseline.lookups);
      await expect(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Generated form', exact: true }) }).locator('select')).toHaveCount(baseline.lookups.length);

      for (const field of fields) {
        const card = fieldCard(page, field.columnName);
        await expect(card).toHaveCount(1);
        if (field.controlType === 'lookup') {
          await expect(card.locator('input[type="search"]')).toHaveCount(1);
          await expect(card.locator('select')).toHaveCount(1);
        } else if (field.controlType === 'textarea') {
          await expect(card.locator('textarea')).toHaveCount(1);
        } else {
          const type = field.controlType === 'boolean' ? 'checkbox'
            : ['number', 'decimal'].includes(field.controlType) ? 'number'
            : field.controlType === 'datetime' ? 'datetime-local'
            : field.controlType === 'date' ? 'date' : 'text';
          await expect(card.locator(`input[type="${type}"]`)).toHaveCount(1);
        }
      }

      if (entity === 'HG') {
        await expect(fieldCard(page, 'CAGECDXH').locator('select')).toBeDisabled();
      }

      for (const field of lookupFields) {
        const card = fieldCard(page, field.columnName);
        const search = card.locator('input[type="search"]');
        const select = card.locator('select');
        const evidence = { column: field.columnName, parent: field.lookup.parentEntityCode, responses: [] };
        lookupEvidence.push(evidence);
        // CA/CB reference lookups are mounted inside initially closed details.
        // A fill on a hidden descendant did not trigger their search request in
        // the recorded runs. Open the section as a user would before probing.
        const details = card.locator('xpath=ancestor::details[1]');
        evidence.sectionInitiallyClosed = await details.count() > 0
          && !(await details.evaluate(element => element.open));
        if (evidence.sectionInitiallyClosed) {
          await details.locator('summary').click();
          await expect(details).toHaveAttribute('open', '');
        }
        await expect(search).toBeVisible();
        await expect(search).toBeEnabled();
        await expect(select).toBeVisible();
        await expect(select).toBeEnabled();
        const query = `OSLAR_READ_ONLY_PROBE_${entity}`;
        const pending = page.waitForResponse(response => {
          const url = new URL(response.url());
          return url.pathname === `/api/compiler/lookups/${field.lookup.parentEntityCode}`
            && url.searchParams.get('relationshipId') === field.lookup.relationshipId
            && url.searchParams.get('q') === query;
        }, { timeout: 5000 });
        await search.fill(query);
        await expect(search).toHaveValue(query);
        const lookupResponse = await pending;
        expect(lookupResponse.request().method()).toBe('GET');
        expect(lookupResponse.status()).toBe(200);
        const result = await lookupResponse.json();
        expect(result.entityCode).toBe(field.lookup.parentEntityCode);
        expect(result.query).toBe(query);
        expect(Array.isArray(result.items)).toBe(true);
        evidence.responses.push({ url: lookupResponse.url(), status: lookupResponse.status(), query: result.query, options: result.items.length });
        await expect(select.locator('option')).toHaveCount(result.items.length + 1);
        await expect(select.locator('option').first()).toHaveText('Select a value');
        const cleared = page.waitForResponse(response => {
          const url = new URL(response.url());
          return url.pathname === `/api/compiler/lookups/${field.lookup.parentEntityCode}`
            && url.searchParams.get('relationshipId') === field.lookup.relationshipId
            && !url.searchParams.has('q');
        }, { timeout: 5000 });
        await search.fill('');
        await expect(search).toHaveValue('');
        const initialResponse = await cleared;
        expect(initialResponse.request().method()).toBe('GET');
        expect(initialResponse.status()).toBe(200);
        const initialResult = await initialResponse.json();
        expect(initialResult.entityCode).toBe(field.lookup.parentEntityCode);
        expect(initialResult.query).toBeNull();
        const items = initialResult.items;
        expect(Array.isArray(items)).toBe(true);
        evidence.responses.push({ url: initialResponse.url(), status: initialResponse.status(), query: initialResult.query, options: items.length });
        await expect(select.locator('option')).toHaveCount(items.length + 1);
        await select.focus();
        // Selecting changes only unsaved browser state; never click Create/Save/Delete.
        if (items.length) {
          await select.selectOption(JSON.stringify(items[0].key));
          for (const [index, column] of field.lookup.foreignKeyColumns.entries()) {
            if (column === field.columnName) continue;
            const companion = fieldCard(page, column).locator('input:not([type="search"])');
            if (await companion.count()) {
              await expect(companion).toHaveValue(String(items[0].key[field.lookup.primaryKeyColumns[index]] ?? ''));
            }
          }
        }
        evidence.options = items.length;
        evidence.selected = items.length > 0;
      }

      if (entity === 'HO') {
        const parents = preview.relationships.filter(r => r.active && r.childEntityCode === 'HO').map(r => r.parentEntityCode);
        expect(parents.sort()).toEqual(['HG', 'XC']);
        expect(lookupFields.map(field => field.lookup.parentEntityCode)).toEqual(['HG', 'XC']);
        expect(lookupFields.map(field => [field.lookup.parentEntityCode, field.columnName]))
          .toEqual([['HG', 'EIACODXA'], ['XC', 'ALCSEIHO']]);
        expect(lookupFields.map(field => [field.lookup.relationshipId, field.columnName]))
          .toEqual(preview.gui.lookupPlan.map(entry => [entry.relationship.relationshipId, entry.anchorColumn]));
        expect(preview.behavior).not.toBeNull();
        expect(preview.behavior.navigationLabel).toBe('Provisioning UOC');
        expect(preview.behavior.allowCreate).toBe(true);
        expect(preview.behavior.allowEdit).toBe(false);
        expect(preview.behavior.allowDelete).toBe(false);

        expect(
          preview.gui.form.sections.map(section => [
            section.sectionCode,
            section.fields.map(field => field.columnName),
          ])
        ).toEqual([
          [
            'part-application',
            [
              'EIACODXA',
              'LCNTYPXB',
              'CAGECDHO',
              'REFNUMHO',
              'LSACONHO',
              'ALTLCNHO',
            ],
          ],
          [
            'system-ei-uoc',
            [
              'LCNSEIHO',
              'ALCSEIHO',
            ],
          ],
        ]);
        relationshipEvidence = { metadataParents: parents, renderedLookupParents: lookupFields.map(field => field.lookup.parentEntityCode), anchors: lookupFields.map(field => ({ parent: field.lookup.parentEntityCode, column: field.columnName })), behavior: preview.behavior };
      }

      const edits = page.locator('table').getByRole('link', { name: 'Edit', exact: true });
      const editCount = await edits.count();
      if (!preview.behavior?.allowEdit) expect(editCount).toBe(0);
      if (editCount) {
        const href = await edits.first().getAttribute('href');
        const url = new URL(href, page.url());
        const keys = preview.fields.filter(field => field.included && !field.deprecated && field.isKey).map(field => field.columnName);
        for (const column of keys) expect(url.searchParams.has(column)).toBe(true);
        const editResponse = await page.goto(href);
        expect(editResponse.status()).toBe(200);
        await expect(page.getByRole('heading', { name: 'Edit record', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();
        for (const column of keys) {
          const card = fieldCard(page, column);
          await expect(card).toHaveCount(1);
          const input = card.locator('input:not([type="search"]), textarea');
          if (await input.count()) {
            await expect(input).toBeDisabled();
            await expect(input).toHaveValue(url.searchParams.get(column));
          } else {
            await expect(card.getByText('Read-only relationship.', { exact: false })).toBeVisible();
            await expect(card.locator('select')).toHaveCount(0);
          }
        }
        editEvidence = `Inspected ${href}; ${keys.length} key fields are read-only. No submission.`;
      } else {
        testInfo.annotations.push({ type: 'coverage limitation', description: editEvidence });
      }
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(blockedWrites).toEqual([]);
    } finally {
      const evidence = { entity, lookupEvidence, relationshipEvidence, editEvidence, pageErrors, consoleErrors, blockedWrites };
      console.log(JSON.stringify(evidence));
      await testInfo.attach(`${entity}-inspection`, { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
      await testInfo.attach(`${entity}-browser`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
  });
}

test('dependent selection clears and reloads when parent changes with identical context', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.request.get('/api/compiler/entities/HO/preview');
  expect(response.status()).toBe(200);
  const preview = await response.json();
  const lookups = preview.gui.form.sections.flatMap(s => s.fields).filter(f => f.lookup);
  const dependent = lookups.find(f => f.lookup.contextFilters.length > 0);
  const upstream = lookups.find(f => f !== dependent && dependent.lookup.contextFilters.some(
    filter => f.lookup.foreignKeyColumns.includes(filter.sourceColumn)));
  expect(upstream).toBeTruthy();
  const parentKey = Object.fromEntries(upstream.lookup.primaryKeyColumns.map((column, i) => [column, `v${i}`]));
  const contextSources = dependent.lookup.contextFilters.map(f => f.sourceColumn);
  const ownIndex = upstream.lookup.foreignKeyColumns.findIndex(c => !contextSources.includes(c));
  expect(ownIndex).toBeGreaterThanOrEqual(0);
  const secondKey = { ...parentKey, [upstream.lookup.primaryKeyColumns[ownIndex]]: 'different-parent' };
  const childKey = Object.fromEntries(dependent.lookup.primaryKeyColumns.map((column, i) => {
    const source = dependent.lookup.foreignKeyColumns[i];
    const parentIndex = upstream.lookup.foreignKeyColumns.indexOf(source);
    return [column, parentIndex < 0 ? `child${i}` : parentKey[upstream.lookup.primaryKeyColumns[parentIndex]]];
  }));
  const dependentRequests = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.abort('blockedbyclient');
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/compiler/lookups/')) return route.continue();
    const id = url.searchParams.get('relationshipId');
    if (id === dependent.lookup.relationshipId) dependentRequests.push(url.searchParams.get('contexts'));
    const keys = id === upstream.lookup.relationshipId ? [parentKey, secondKey] : [childKey];
    await route.fulfill({ json: { items: keys.map((key, i) => ({ key, label: `Choice ${i}`, display: {} })) } });
  });
  await page.goto('/lsar/entities/HO');
  const parentSelect = fieldCard(page, upstream.columnName).locator('select');
  const childSelect = fieldCard(page, dependent.columnName).locator('select');
  await expect(parentSelect.locator('option')).toHaveCount(3);
  await parentSelect.selectOption(JSON.stringify(parentKey));
  await expect(childSelect.locator('option')).toHaveCount(2);
  await childSelect.selectOption(JSON.stringify(childKey));
  await expect(childSelect).toHaveValue(JSON.stringify(childKey));
  // Allow the selection-triggered reload to complete before measuring the next one.
  await expect.poll(() => dependentRequests.length).toBeGreaterThanOrEqual(2);
  await expect(childSelect.locator('option')).toHaveCount(2);
  const before = dependentRequests.length;
  await parentSelect.selectOption(JSON.stringify(secondKey));
  await expect(childSelect).toHaveValue('');
  for (let i = 0; i < dependent.lookup.foreignKeyColumns.length; i++) {
    const column = dependent.lookup.foreignKeyColumns[i];
    if (!upstream.lookup.foreignKeyColumns.includes(column) && column !== dependent.columnName) {
      await expect(fieldCard(page, column).locator('input:not([type="search"])')).toHaveValue('');
    }
  }
  await expect.poll(() => dependentRequests.length).toBeGreaterThan(before);
  const expectedContexts = Object.fromEntries(contextSources.map(column => [column,
    parentKey[upstream.lookup.primaryKeyColumns[upstream.lookup.foreignKeyColumns.indexOf(column)]] ]));
  expect(JSON.parse(dependentRequests.at(-1))).toEqual(expectedContexts);
  expect(errors).toEqual([]);
});
