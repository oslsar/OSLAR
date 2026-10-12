// Real delete compiler with stubbed metadata and SQL: no database connections/writes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const url = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
function field(columnName, isKey = false) { return { columnName, isKey, included: true, deprecated: false }; }
function entity(code, table, fields) { return { entity: { entityCode: code }, behavior: { allowDelete: true },
  database: { tableExists: true, schemaName: 'resolved_schema', tableName: table }, fields, relationships: [] }; }
const relationship = { relationshipId: 'r', parentEntityCode: 'PARENT', childEntityCode: 'CHILD',
  relationshipType: 'foreign_key', active: true, foreignKeyColumns: ['CHILD_B', 'CHILD_A'], primaryKeyColumns: ['B', 'A'] };
let entities, queries, connected, released, parentRows, childExists, deletedCount, thrown;
function reset() {
  entities = { PARENT: entity('PARENT', 'resolved_parent', [field('A', true), field('B', true), field('OTHER')]),
    CHILD: entity('CHILD', 'resolved_child', [field('CHILD_A'), field('CHILD_B')]) };
  queries = []; connected = 0; released = 0; parentRows = [{ A: 'a', B: 'b', OTHER: 'mapped-value' }];
  childExists = false; deletedCount = 1; thrown = null;
}
globalThis.__deletePreview = async code => entities[code] ?? null;
globalThis.__deletePool = { async connect() { connected++; return {
  async query(sql, parameters) {
    queries.push({ sql, parameters });
    if (sql.startsWith('DELETE')) {
      if (thrown) throw thrown;
      return { rows: [], rowCount: deletedCount };
    }
    if (sql.startsWith('SELECT 1')) return { rows: childExists ? [{}] : [], rowCount: childExists ? 1 : 0 };
    if (sql.startsWith('SELECT')) return { rows: parentRows, rowCount: parentRows.length };
    return { rows: [], rowCount: null };
  }, release() { released++; },
}; } };
const source = stripTypeScriptTypes(read('../lib/compiler/delete.ts'))
  .replace('"@/lib/db"', JSON.stringify(url('export const pool = globalThis.__deletePool;')))
  .replace('"@/lib/compiler/preview"', JSON.stringify(url('export const buildEntityPreview = globalThis.__deletePreview;')));
const { deleteEntityRecord } = await import(url(source));
const keys = { A: 'a', B: 'b' };

test('metadata existence, permissions and complete exact scalar keys are independently checked', async () => {
  reset(); assert.equal((await deleteEntityRecord('MISSING', keys)).status, 404);
  entities.PARENT.behavior.allowDelete = false;
  assert.equal((await deleteEntityRecord('PARENT', keys)).status, 403);
  entities.PARENT.behavior.allowDelete = true;
  for (const invalid of [{ A: 'a' }, { ...keys, OTHER: 'extra' }, { ...keys, 'evil;DROP': 'x' },
    { ...keys, B: '' }, { ...keys, B: {} }, { ...keys, B: Infinity }, Object.create(keys)]) {
    assert.equal((await deleteEntityRecord('PARENT', invalid)).status, 400);
  }
  assert.equal(connected, 0);
});

test('unreferenced composite-key row deletes once with bound values in one transaction', async () => {
  reset(); const input = { A: "a' OR 1=1 --", B: 'b' };
  const result = await deleteEntityRecord('PARENT', input);
  assert.equal(result.ok, true); assert.deepEqual(result.deletedKey, input);
  const deletion = queries.find(q => q.sql.startsWith('DELETE'));
  assert.equal(deletion.sql, 'DELETE FROM "resolved_schema"."resolved_parent" WHERE "A" = $1 AND "B" = $2 RETURNING 1');
  assert.deepEqual(deletion.parameters, [input.A, input.B]);
  assert.ok(!deletion.sql.includes(input.A));
  assert.equal(queries[0].sql, 'BEGIN'); assert.equal(queries.at(-1).sql, 'COMMIT');
  assert.equal(released, 1);
});

test('metadata-defined child references block parent deletion with a useful reason', async () => {
  reset(); entities.PARENT.relationships = [relationship]; childExists = true;
  const result = await deleteEntityRecord('PARENT', keys);
  assert.equal(result.status, 409); assert.match(result.error, /referenced by CHILD/);
  assert.ok(!queries.some(q => q.sql.startsWith('DELETE')));
  const check = queries.find(q => q.sql.startsWith('SELECT 1'));
  assert.equal(check.sql, 'SELECT 1 FROM "resolved_schema"."resolved_child" WHERE "CHILD_B" = $1 AND "CHILD_A" = $2 LIMIT 1');
  assert.deepEqual(check.parameters, ['b', 'a']);
  assert.match(queries[1].sql, /resolved_child.*resolved_parent.*SHARE ROW EXCLUSIVE/);
  assert.equal(queries.at(-1).sql, 'ROLLBACK'); assert.equal(released, 1);
});

test('relationship checks use actual mapped parent values, including non-key mappings', async () => {
  reset(); entities.PARENT.relationships = [{ ...relationship, primaryKeyColumns: ['OTHER'], foreignKeyColumns: ['CHILD_A'], relationshipType: 'reference_lookup' }];
  assert.equal((await deleteEntityRecord('PARENT', keys)).ok, true);
  assert.deepEqual(queries.find(q => q.sql.startsWith('SELECT 1')).parameters, ['mapped-value']);
});

test('bad relationship mappings or unavailable child metadata fail closed', async () => {
  for (const variation of ['missing', 'mismatch', 'column', 'parent-column']) {
    reset(); entities.PARENT.relationships = [structuredClone(relationship)];
    if (variation === 'missing') delete entities.CHILD;
    if (variation === 'mismatch') entities.PARENT.relationships[0].foreignKeyColumns = ['CHILD_A'];
    if (variation === 'column') entities.PARENT.relationships[0].foreignKeyColumns[0] = 'UNKNOWN';
    if (variation === 'parent-column') entities.PARENT.relationships[0].primaryKeyColumns[0] = 'UNKNOWN';
    const result = await deleteEntityRecord('PARENT', keys);
    assert.equal(result.status, 409); assert.equal(result.stage, 'relationships'); assert.equal(connected, 0);
  }
});

test('zero/multiple parent matches and zero/multiple deletes roll back safely', async () => {
  for (const count of [0, 2]) {
    reset(); parentRows = Array.from({ length: count }, () => ({ ...keys }));
    assert.equal((await deleteEntityRecord('PARENT', keys)).ok, false);
    assert.ok(!queries.some(q => q.sql.startsWith('DELETE')));
    assert.equal(queries.at(-1).sql, 'ROLLBACK');
    reset(); deletedCount = count;
    assert.equal((await deleteEntityRecord('PARENT', keys)).ok, false);
    assert.equal(queries.at(-1).sql, 'ROLLBACK');
    assert.ok(!queries.some(q => q.sql === 'COMMIT')); assert.equal(released, 1);
  }
});

test('physical FK failure and unexpected database errors roll back and release', async () => {
  reset(); thrown = Object.assign(new Error('FK'), { code: '23503' });
  assert.equal((await deleteEntityRecord('PARENT', keys)).status, 409);
  assert.equal(queries.at(-1).sql, 'ROLLBACK'); assert.equal(released, 1);
  reset(); thrown = new Error('unexpected');
  await assert.rejects(() => deleteEntityRecord('PARENT', keys), /unexpected/);
  assert.equal(queries.at(-1).sql, 'ROLLBACK'); assert.equal(released, 1);
});

test('delete visibility is metadata-driven and generic delete code never cascades', () => {
  const page = read('../app/lsar/entities/[entity]/page.tsx');
  assert.match(page, /preview\.behavior\?\.allowDelete && \(\s*<DeleteRecordButton/);
  const condition = page.match(/\{(preview\.behavior\?\.allowDelete) && \(\s*<DeleteRecordButton/)[1];
  const visible = new Function('preview', `return Boolean(${condition});`);
  assert.equal(visible({ behavior: { allowDelete: false } }), false);
  assert.equal(visible({ behavior: { allowDelete: true } }), true);
  assert.match(page, /keyColumns=\{data\.keyColumns\}/);
  for (const path of ['../lib/compiler/delete.ts', '../components/compiler/delete-record-button.tsx', '../app/lsar/entities/[entity]/page.tsx']) {
    assert.doesNotMatch(read(path), /WESCAM_/);
  }
  assert.doesNotMatch(read('../lib/compiler/delete.ts'), /CASCADE|DELETE FROM.*child|UPDATE /);
});

// Execute the actual UI handler without a browser; every request is mocked.
const button = read('../components/compiler/delete-record-button.tsx');
const handler = button.match(/async function handleDelete\(\) \{([\s\S]*?)\n  \}\n\n  return/)[1];
const runHandler = new Function('window', 'fetch', 'router', 'entityCode', 'keyColumns', 'row', 'setDeleting', 'setError', 'CustomEvent', `return (async () => {${handler}})();`);
test('UI requires confirmation and preserves URL while refreshing success or displaying refusal', async () => {
  let requests = [], refreshes = 0, errors = [], notifications = [];
  const fakeWindow = { confirm: () => false, dispatchEvent: event => notifications.push(event.detail) };
  const fetch = async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }; };
  const router = { refresh: () => refreshes++ };
  class FakeEvent { constructor(name, options) { this.detail = options.detail; } }
  const invoke = request => runHandler(fakeWindow, request, router, 'PARENT', ['A', 'B'], { ...keys, OTHER: 'exclude' }, () => {}, e => errors.push(e), FakeEvent);
  await invoke(fetch); assert.equal(requests.length, 0);
  fakeWindow.confirm = message => { assert.match(message, /cannot be undone/); return true; };
  await invoke(fetch);
  assert.deepEqual(JSON.parse(requests[0].options.body), { keys });
  assert.equal(requests[0].options.method, 'DELETE'); assert.equal(refreshes, 1);
  assert.deepEqual(notifications, ['PARENT']);
  await invoke(async () => ({ ok: false, json: async () => ({ error: 'Referenced by CHILD' }) }));
  assert.equal(errors.at(-1), 'Referenced by CHILD'); assert.equal(refreshes, 1);
});
