import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { listCapabilities, normalizeListCriteria, listPredicate, listQueryString } from '../lib/compiler/list-query.ts';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const fields = [
  ['ID', 'integer', false, true], ['NAME', 'string(40)', true, true],
  ['NOTE', 'text', true, true], ['PRICE', 'numeric(20,4)', false, true],
  ['ENABLED', 'boolean', false, true], ['PRIVATE', 'text', true, false],
  ['DAY', 'date', false, true], ['STAMP', 'timestamp without time zone', false, true],
  ['HIDDEN', 'text', true, true], ['RETIRED', 'text', true, true],
].map(([columnName, formatSpec, searchable, filterable]) => ({ columnName, formatSpec,
  searchable, filterable, label: `Label ${columnName}`, included: true,
  deprecated: columnName === 'RETIRED', isKey: columnName === 'ID',
  behavior: { hidden: columnName === 'HIDDEN' } }));
function preview() { return {
  entity: { entityCode: 'GENERIC' }, database: { tableExists: true, schemaName: 'lsar_core', tableName: 'GENERIC' },
  fields: structuredClone(fields), gui: { generatedFields: structuredClone(fields), listColumns: ['ID', 'NAME', 'PRICE'], defaultSort: 'NAME' },
  behavior: { defaultSearchColumns: ['NAME', 'MISSING', 'PRICE', 'HIDDEN', 'RETIRED'], defaultSortDirection: 'desc', defaultPageSize: 12 },
}; }
const criteria = params => normalizeListCriteria(preview(), params);

test('search uses only configured, searchable, usable compiler fields', () => {
  assert.deepEqual(listCapabilities(preview()).searchColumns, ['NAME']);
  const p = preview(); p.gui.generatedFields.find(f => f.columnName === 'NAME').searchable = false;
  assert.deepEqual(listCapabilities(p).searchColumns, []);
  assert.equal(normalizeListCriteria(p, { q: 'query' }).search, '');
  p.behavior.defaultSearchColumns = null;
  assert.deepEqual(listCapabilities(p).searchColumns, []);
});

test('URL columns cannot override search scope or filter approval', () => {
  const parsed = criteria({ q: 'hello', searchColumns: 'NOTE', 'filter.PRIVATE': 'secret',
    'filter.EVIL"': 'attack', 'filter.HIDDEN': 'hidden', 'filter.RETIRED': 'old', 'filter.DAY': '2026-01-01' });
  assert.deepEqual(parsed.filters, []);
  const predicate = listPredicate(preview(), parsed);
  assert.equal(predicate.sql, 'WHERE ("NAME" ILIKE $1)');
  assert.deepEqual(predicate.values, ['%hello%']);
});

test('text contains uses bound ILIKE values and literal wildcard escaping', () => {
  const predicate = listPredicate(preview(), criteria({ q: "' OR 1=1 --%_\\", 'filter.NOTE': 'AbC' }));
  assert.equal(predicate.sql, 'WHERE ("NAME" ILIKE $1) AND "NOTE" ILIKE $2');
  assert.deepEqual(predicate.values, ["%' OR 1=1 --\\%\\_\\\\%", '%AbC%']);
  assert.ok(!predicate.sql.includes('1=1'));
});

test('numeric, integer and boolean filters use exact typed parameters joined with AND', () => {
  const predicate = listPredicate(preview(), criteria({ 'filter.PRICE': '1234567890123456.1234', 'filter.ID': '123', 'filter.ENABLED': 'false' }));
  assert.equal(predicate.sql, 'WHERE "ID" = $1::numeric AND "PRICE" = $2::numeric AND "ENABLED" = $3::boolean');
  assert.deepEqual(predicate.values, ['123', '1234567890123456.1234', false]);
  assert.deepEqual(criteria({ 'filter.ID': '1.2', 'filter.PRICE': 'NaN', 'filter.ENABLED': 'yes' }).filters, []);
});

test('search OR group combines with multiple filters using AND', () => {
  const p = preview(); p.behavior.defaultSearchColumns = ['NAME', 'NOTE'];
  const predicate = listPredicate(p, { search: 'find', filters: [{ column: 'PRICE', value: '2.00' }, { column: 'ENABLED', value: 'true' }], page: 3 });
  assert.equal(predicate.sql, 'WHERE ("NAME" ILIKE $1 OR "NOTE" ILIKE $1) AND "PRICE" = $2::numeric AND "ENABLED" = $3::boolean');
  assert.deepEqual(predicate.values, ['%find%', '2.00', true]);
});

test('URL normalization removes empty/invalid criteria and supports bookmarks and paging', () => {
  const c = criteria({ q: ' hi ', 'filter.NOTE': ' note ', 'filter.ID': '', page: '3', arbitrary: 'bad' });
  assert.equal(listQueryString(c), '?q=hi&filter.NOTE=note&page=3');
  assert.equal(listQueryString(c, 1), '?q=hi&filter.NOTE=note');
  assert.equal(listQueryString(criteria({ q: ' ', page: '-2' })), '');
  assert.equal(criteria({ q: ['one', 'two'], 'filter.NOTE': ['one', 'two'], page: '1e9' }).page, 1);
  assert.equal(listQueryString(criteria({ q: ['one', 'two'], 'filter.NOTE': ['one', 'two'] })), '');
});

const calls = [];
globalThis.__listTestPool = { async query(sql, values) {
  calls.push({ sql, values });
  return { rows: [{ total_count: '30', page: '2', records: [{ ID: 1, NAME: 'one', PRICE: '1234567890123456.1234' }] }] };
} };
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const poolUrl = moduleUrl('export const pool = globalThis.__listTestPool;');
const dataUrl = moduleUrl(stripTypeScriptTypes(read('../lib/compiler/data.ts'))
  .replace('"@/lib/db"', JSON.stringify(poolUrl))
  .replace('"@/lib/compiler/list-query"', JSON.stringify(new URL('../lib/compiler/list-query.ts', import.meta.url).href)));
const { getEntityRows } = await import(dataUrl);

test('actual data query counts filtered results and filters before paging in one statement', async () => {
  const p = preview(); const c = criteria({ q: 'abc', 'filter.PRICE': '2', page: '2' });
  const data = await getEntityRows(p, p.behavior.defaultPageSize, c);
  const { sql, values } = calls.at(-1);
  assert.deepEqual(values, ['%abc%', '2', 12, 2]);
  assert.equal((sql.match(/WHERE \("NAME" ILIKE \$1\) AND "PRICE" = \$2::numeric/g) ?? []).length, 2);
  assert.match(sql, /count\(\*\).*WHERE/s);
  assert.match(sql, /WHERE[\s\S]*ORDER BY list_source\."NAME" DESC NULLS LAST, list_source\."ID" DESC NULLS LAST\s+LIMIT \$3::integer\s+OFFSET/);
  assert.match(sql, /LEAST\(\$4::bigint/);
  assert.match(sql, /"PRICE"::text AS "PRICE"/);
  assert.equal(data.totalCount, 30); assert.equal(data.page, 2); assert.equal(data.limit, 12);
  assert.equal(data.rows[0].PRICE, '1234567890123456.1234');
});

test('default sort fallback and ascending direction remain safe', async () => {
  const p = preview(); p.gui.defaultSort = 'UNAPPROVED'; p.behavior.defaultSortDirection = null;
  await getEntityRows(p);
  assert.match(calls.at(-1).sql, /ORDER BY list_source\."ID" ASC NULLS LAST/);
  assert.deepEqual(calls.at(-1).values, [25, 1]);
  p.gui.defaultSort = 'PRICE';
  await getEntityRows(p);
  assert.match(calls.at(-1).sql, /ORDER BY list_source\."PRICE" ASC NULLS LAST/);
  p.database.tableName = 'bad;DROP';
  await assert.rejects(() => getEntityRows(p), /Unsafe database identifier/);
});

test('missing tables produce empty paging results without queries', async () => {
  const p = preview(); p.database.tableExists = false;
  const count = calls.length; const result = await getEntityRows(p);
  assert.equal(calls.length, count); assert.equal(result.totalCount, 0); assert.equal(result.page, 1);
});

test('implementation remains generic and URL criteria reset page when applied', () => {
  for (const path of ['../lib/compiler/list-query.ts', '../lib/compiler/data.ts', '../components/compiler/list-controls.tsx', '../app/lsar/entities/[entity]/page.tsx']) {
    assert.doesNotMatch(read(path), /WESCAM_|OPUS001/);
  }
  const controls = read('../components/compiler/list-controls.tsx');
  assert.match(controls, /page: 1/);
  assert.match(controls, /<details/);
  assert.match(controls, /filters\.map\(filter/);
});
