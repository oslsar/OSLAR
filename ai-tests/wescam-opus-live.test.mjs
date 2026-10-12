// Administrator runs AFTER applying 041/042. GET-only; no fixtures or writes.
// node --experimental-strip-types --test ai-tests/wescam-opus-live.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(new URL('./fixtures/wescam-opus-schema.json', import.meta.url)));
const keyCounts = { XA: 1, XB: 4, XC: 4, HA: 3, HG: 6, HO: 8, THA: 3, THG: 6, XF: 7 };
const base = process.env.OSLAR_PREVIEW_BASE_URL ?? 'http://127.0.0.1:3002';
test('generated navigation links to all nine migrated Wescam entities', async () => {
  const response = await fetch(`${base}/lsar`);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const name of Object.keys(source)) {
    assert.ok(html.includes(`/lsar/entities/WESCAM_${name}`));
  }
});
for (const [name, columns] of Object.entries(source)) {
  test(`WESCAM_${name}: migrated preview API discovers the physical table and create form`, async () => {
    const code = `WESCAM_${name}`;
    const response = await fetch(`${base}/api/compiler/entities/${code}/preview`);
    assert.equal(response.status, 200);
    const p = await response.json();
    assert.equal(p.entity.entityCode, code);
    assert.equal(p.entity.profileCode, 'WESCAM_OPUS');
    assert.equal(p.database.tableExists, true);
    assert.equal(p.database.schemaName, 'lsar_core');
    assert.equal(p.database.tableName, code);
    assert.equal(p.summary.keyFieldCount, keyCounts[name]);
    assert.equal(p.behavior.allowCreate, true);
    assert.equal(p.behavior.allowEdit, false);
    assert.equal(p.behavior.allowDelete, false);
    assert.equal(p.behavior.allowImport, false);
    const fields = p.gui.form.sections.flatMap(s => s.fields);
    assert.deepEqual(fields.map(f => f.columnName), columns.map(c => c.name));
    assert.deepEqual(fields.map(f => f.formatSpec), columns.map(c => c.type.replace('character varying', 'string')));
    assert.ok(p.gui.lookupPlan.every(e => e.diagnostic === null));
    const expected = {
      XA: [], XB: [['WESCAM_XA', 'EIACODXA']], XC: [['WESCAM_XB', 'EIACODXA']],
      HA: [], HG: [['WESCAM_XB', 'EIACODXA']], THA: [], THG: [],
      HO: [['WESCAM_HG', 'EIACODXA'], ['WESCAM_XC', 'ALCSEIHO']],
      XF: [['WESCAM_XB', 'LSACONXF'], ['WESCAM_XC', 'LCNSEIXF']],
    }[name];
    assert.deepEqual(fields.filter(f => f.lookup).map(f => [f.lookup.parentEntityCode, f.columnName]).sort(), expected.sort());
    if (name === 'HO' || name === 'XF') {
      const lookup = fields.find(f => f.lookup?.parentEntityCode === 'WESCAM_XC').lookup;
      assert.deepEqual(lookup.contextFilters, name === 'HO' ? [
        { column: 'EIACODXA', sourceColumn: 'EIACODXA' },
        { column: 'LCNTYPXB', sourceColumn: 'LCNTYPXB' },
      ] : [{ column: 'EIACODXA', sourceColumn: 'EIACODXA' }]);
    }
    const page = await fetch(`${base}/lsar/entities/${code}`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Generated list view/);
    assert.match(html, /Create record/);
  });
}
