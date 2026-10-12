import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyLookupValues } from '../lib/compiler/lookup-selection.ts';

function lookup(id, columns, contexts = [], legacy = null) {
  return { relationshipId: id, foreignKeyColumns: columns,
    primaryKeyColumns: columns.map(c => `P_${c}`),
    contextFilters: contexts.map(c => ({ sourceColumn: c, column: `P_${c}` })),
    contextSourceColumn: legacy };
}
const upstream = lookup('A', ['CONTEXT', 'TYPE', 'PART']);
const key = part => ({ P_CONTEXT: 'same', P_TYPE: 'same-type', P_PART: part });

for (const [name, dependent] of [
  ['eq_context', lookup('B', ['CONTEXT', 'DETAIL', 'LINE'], ['CONTEXT'], 'CONTEXT')],
  ['eq_contexts', lookup('B', ['CONTEXT', 'TYPE', 'DETAIL', 'LINE'], ['CONTEXT', 'TYPE'])],
  ['legacy single context', lookup('B', ['CONTEXT', 'DETAIL', 'LINE'], [], 'CONTEXT')],
]) {
  test(`${name}: changing parent with identical context clears dependent-owned fields`, () => {
    const lookups = [upstream, dependent];
    const first = applyLookupValues({}, upstream, key('first'), lookups);
    const selected = applyLookupValues(first, dependent, {
      P_CONTEXT: 'same', P_TYPE: 'same-type', P_DETAIL: 'detail', P_LINE: 'line',
    }, lookups);
    const before = structuredClone(selected);
    const next = applyLookupValues(selected, upstream, key('second'), lookups);
    assert.equal(next.DETAIL, '');
    assert.equal(next.LINE, '');
    assert.equal(next.CONTEXT, 'same');
    assert.equal(next.TYPE, 'same-type');
    assert.equal(next.PART, 'second');
    assert.deepEqual(selected, before);
    assert.equal(applyLookupValues(selected, upstream, key('first'), lookups).DETAIL, 'detail');
  });
}

test('competing dependent lookups clear only their own fields; unrelated lookups survive', () => {
  const b = lookup('B', ['CONTEXT', 'DETAIL'], ['CONTEXT']);
  const c = lookup('C', ['TYPE', 'OTHER'], ['TYPE']);
  const unrelated = lookup('D', ['UNRELATED', 'KEEP'], ['UNRELATED']);
  const current = { CONTEXT: 'same', TYPE: 'same-type', PART: 'first',
    DETAIL: 'b', OTHER: 'c', UNRELATED: 'u', KEEP: 'keep' };
  assert.deepEqual(applyLookupValues(current, upstream, key('second'), [c, unrelated, b, upstream]),
    { ...current, PART: 'second', DETAIL: '', OTHER: '' });
  const changed = applyLookupValues(current, upstream, { ...key('second'), P_CONTEXT: 'new' }, [b, c]);
  assert.equal(changed.CONTEXT, 'new');
  assert.equal(changed.DETAIL, '');
});
