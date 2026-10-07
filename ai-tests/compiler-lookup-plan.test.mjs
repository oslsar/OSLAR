// Non-browser compiler tests. Run from the repository root:
// node --experimental-strip-types --test ai-tests/compiler-lookup-plan.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planLookupAnchors } from '../lib/compiler/lookup-plan.ts';

function relationship(parent, columns, anchor = null, id = parent) {
  return {
    relationshipId: id, childEntityCode: 'CHILD', parentEntityCode: parent,
    constraintName: null, relationshipLabel: null, relationshipType: 'foreign_key',
    foreignKeyColumns: columns, primaryKeyColumns: columns.map(c => `P_${c}`),
    lookupAnchorColumn: anchor, lookupFilter: null, active: true,
  };
}

function plan(relationships, available = relationships.flatMap(r => r.foreignKeyColumns)) {
  return planLookupAnchors(relationships, new Set(available));
}

test('empty input has an empty plan', () => {
  assert.deepEqual(plan([]), []);
});

test('default collisions use relationship-specific FK fields in FK order', () => {
  const input = [relationship('B', ['SHARED', 'B1', 'B2', 'TYPE']),
    relationship('A', ['SHARED', 'A1', 'TYPE'])];
  const result = plan(input);
  assert.deepEqual(result.map(e => [e.anchorColumn, e.anchorSource]),
    [['SHARED', 'default'], ['B1', 'inferred']]);
  assert.deepEqual(result, plan([...input].reverse()));
});

test('explicit metadata takes precedence over earlier implicit defaults', () => {
  const result = plan([relationship('A', ['SHARED', 'A1']),
    relationship('Z', ['SHARED', 'Z1'], 'SHARED')]);
  assert.deepEqual(result.map(e => [e.anchorColumn, e.anchorSource]),
    [['A1', 'inferred'], ['SHARED', 'explicit']]);
});

test('explicit non-first anchors and filters survive without mutation', () => {
  const input = [relationship('A', ['SHARED', 'PART'], 'PART')];
  input[0].lookupFilter = { operator: 'eq_contexts', filters: [
    { sourceColumn: 'SHARED', column: 'P_SHARED' },
  ] };
  const before = structuredClone(input);
  const result = plan(input);
  assert.equal(result[0].anchorColumn, 'PART');
  assert.deepEqual(result[0].relationship.lookupFilter, before[0].lookupFilter);
  assert.deepEqual(input, before);
});

test('uncontested defaults are reserved before inferred anchors', () => {
  const result = plan([relationship('A', ['SHARED', 'A1']),
    relationship('B', ['SHARED', 'C1', 'B1']), relationship('C', ['C1'])]);
  assert.deepEqual(result.map(e => e.anchorColumn), ['SHARED', 'B1', 'C1']);
});

test('unavailable FK fields cannot become inferred anchors', () => {
  const result = plan([relationship('A', ['SHARED', 'A1']),
    relationship('B', ['SHARED', 'HIDDEN', 'B1'])], ['SHARED', 'A1', 'B1']);
  assert.equal(result[1].anchorColumn, 'B1');
});

test('a collision with no unique field remains represented with a diagnostic', () => {
  const result = plan([relationship('A', ['SHARED']), relationship('B', ['SHARED'])]);
  assert.equal(result.length, 2);
  assert.equal(result[1].anchorColumn, null);
  assert.equal(result[1].anchorSource, 'unresolved');
  assert.match(result[1].diagnostic, /No available relationship-specific/);
});

test('conflicting explicit anchors are retained and diagnosed on both entries', () => {
  const result = plan([relationship('A', ['SHARED', 'A1'], 'SHARED'),
    relationship('B', ['SHARED', 'B1'], 'SHARED')]);
  for (const entry of result) {
    assert.equal(entry.anchorColumn, 'SHARED');
    assert.equal(entry.anchorSource, 'explicit');
    assert.match(entry.diagnostic, /Multiple explicit/);
  }
});

test('invalid explicit anchors are diagnosed rather than replaced', () => {
  for (const anchor of ['NOT_FK', 'HIDDEN']) {
    const result = plan([relationship('A', ['SHARED', 'HIDDEN'], anchor)], ['SHARED']);
    assert.equal(result[0].anchorColumn, null);
    assert.match(result[0].diagnostic, /Explicit lookup anchor/);
  }
});

test('relationship IDs deterministically break ties for the same parent', () => {
  const input = [relationship('A', ['SHARED', 'SECOND'], null, '2'),
    relationship('A', ['SHARED', 'FIRST'], null, '1')];
  assert.deepEqual(plan(input).map(e => e.anchorColumn), ['SHARED', 'SECOND']);
  assert.deepEqual(plan(input), plan([...input].reverse()));
});

// Read-only HTTP checks exercise buildEntityPreview against development metadata.
// No browser, submissions, database fixtures, or write requests are used.
const baselines = {
  XA: [29, []], XB: [14, [['XA', 'EIACODXA']]],
  CA: [38, [['XB', 'EIACODXA'], ['CA', 'REFEIACA']]],
  CB: [18, [['CA', 'EIACODXA'], ['CB', 'RFDEIACB']]],
  XC: [13, [['XB', 'EIACODXA']]],
  HA: [68, [['XA', 'EIACODXA'], ['XH', 'CAGECDXH']]],
  HG: [70, [['XB', 'EIACODXA'], ['HA', 'CAGECDXH']]],
  HO: [8, [['HG', 'EIACODXA']]],
};

for (const [entity, [fieldCount, rendered]] of Object.entries(baselines)) {
  test(`${entity}: live preview preserves legacy projection and all planned relationships`, async () => {
    const response = await fetch(`http://127.0.0.1:3002/api/compiler/entities/${entity}/preview`);
    assert.equal(response.status, 200);
    const preview = await response.json();
    const fields = preview.gui.form.sections.flatMap(s => s.fields);
    assert.equal(fields.length, fieldCount);
    assert.deepEqual(fields.filter(f => f.lookup).map(f =>
      [f.lookup.parentEntityCode, f.columnName]), rendered);
    const outgoing = preview.relationships.filter(r => r.active &&
      r.childEntityCode === entity && ['foreign_key', 'reference_lookup'].includes(r.relationshipType));
    const available = new Set(preview.fields.filter(f => f.included &&
      !f.deprecated && !f.behavior.hidden).map(f => f.columnName));
    assert.deepEqual(preview.gui.lookupPlan, planLookupAnchors(outgoing, available));
    assert.equal(preview.gui.lookupPlan.length, outgoing.length);
    assert.ok(preview.gui.lookupPlan.every(e => e.diagnostic === null));
    assert.deepEqual(preview.gui.lookupPlan.map(e =>
      [e.relationship.parentEntityCode, e.anchorColumn]).sort(),
      (entity === 'HO' ? [['HG', 'EIACODXA'], ['XC', 'ALCSEIHO']] : rendered).toSorted());
    if (entity === 'HG') {
      const appliedPart = preview.gui.lookupPlan.find(e => e.relationship.parentEntityCode === 'HA');
      assert.equal(appliedPart.anchorSource, 'explicit');
      assert.deepEqual(appliedPart.relationship.lookupFilter,
        { column: 'EIACODXA', operator: 'eq_context', sourceColumn: 'EIACODXA' });
      assert.deepEqual(fields.find(f => f.columnName === 'CAGECDXH').lookup.contextFilters,
        [{ column: 'EIACODXA', sourceColumn: 'EIACODXA' }]);
    }
    if (entity === 'XC') {
      assert.deepEqual(preview.gui.lookupPlan[0].relationship.lookupFilter,
        { column: 'SYSIDNXB', operator: 'in', values: ['S', 'E'] });
    }
    if (entity === 'HO') {
      assert.deepEqual(preview.gui.lookupPlan.map(e => e.anchorSource), ['default', 'inferred']);
      assert.deepEqual(preview.gui.lookupPlan[1].relationship.foreignKeyColumns,
        ['EIACODXA', 'ALCSEIHO', 'LCNSEIHO', 'LCNTYPXB']);
      assert.deepEqual(preview.gui.lookupPlan[1].relationship.primaryKeyColumns,
        ['EIACODXA', 'ALTLCNXB', 'LSACONXB', 'LCNTYPXB']);
    }
  });
}
