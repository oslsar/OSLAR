// Database-free migration contract and actual metadata/preview compiler tests.
// The SQL boundary is stubbed; no database connections or writes are made.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { planLookupAnchors } from '../lib/compiler/lookup-plan.ts';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
export const source = JSON.parse(read('./fixtures/wescam-opus-schema.json'));
export const keys = {
  XA: ['EIACODXA'],
  XB: ['EIACODXA', 'ALTLCNXB', 'LSACONXB', 'LCNTYPXB'],
  XC: ['EIACODXA', 'ALTLCNXB', 'LSACONXB', 'LCNTYPXB'],
  HA: ['EIACODXA', 'CAGECDXH', 'REFNUMHA'],
  HG: ['EIACODXA', 'ALTLCNXB', 'LSACONXB', 'LCNTYPXB', 'CAGECDXH', 'REFNUMHA'],
  HO: ['EIACODXA', 'LCNTYPXB', 'CAGECDHO', 'REFNUMHO', 'LSACONHO', 'ALTLCNHO', 'LCNSEIHO', 'ALCSEIHO'],
  THA: ['EIACODXA', 'CAGECDXH', 'REFNUMHA'],
  THG: ['EIACODXA', 'ALTLCNXB', 'LSACONXB', 'LCNTYPXB', 'CAGECDXH', 'REFNUMHA'],
  XF: ['EIACODXA', 'LSACONXF', 'ALTLCNXF', 'LCNTYPXF', 'LCNSEIXF', 'ALCSEIXF', 'LTYSEIXF'],
};
const entitiesSql = read('../oslar-db/migrations/20261010_041_add_wescam_opus_trial_entities.sql');
const presentationSql = read('../oslar-db/migrations/20261010_042_add_wescam_opus_trial_presentation.sql');
const editSql = read('../oslar-db/migrations/20261011_043_enable_wescam_edit.sql');
const editDownSql = read('../oslar-db/rollback/20261011_043_enable_wescam_edit_down.sql');
const quoted = line => [...line.matchAll(/'((?:''|[^'])*)'/g)].map(m => m[1].replaceAll("''", "'"));
const relationships = entitiesSql.split('\n').filter(l => l.startsWith("('WESCAM_") && l.includes("'foreign_key'"))
  .map((line, index) => {
    const [child, parent, constraint, type, label, fk, pk, anchor, filter] = quoted(line);
    return { relationship_id: String(index + 1), child_entity_code: child, parent_entity_code: parent,
      constraint_name: constraint, relationship_type: type, relationship_label: label,
      fk_columns: JSON.parse(fk), pk_columns: JSON.parse(pk), lookup_anchor_column: anchor,
      lookup_filter: filter?.startsWith('{') ? JSON.parse(filter) : null, active: true };
  });
const behaviors = Object.fromEntries(presentationSql.split('\n').filter(l => l.startsWith("('WESCAM_"))
  .map(line => {
    const [code, label, sort, direction, lookup, list, search] = quoted(line);
    assert.match(line, /TRUE, FALSE, FALSE, FALSE, TRUE, TRUE\)/);
    return [code, { entity_code: code, navigation_label: label, default_sort_column: sort,
      default_sort_direction: direction, default_page_size: 25,
      lookup_display_columns: JSON.parse(lookup), default_list_columns: JSON.parse(list),
      default_search_columns: JSON.parse(search), allow_create: true, allow_edit: false,
      allow_delete: false, allow_import: false, allow_export: true }];
  }));

// Model the narrowly scoped permission UPDATE at the stubbed SQL boundary.
// Contract checks below ensure the modeled statement is the migration's only UPDATE.
function applyEditMigration(sql, rows) {
  const update = sql.match(/UPDATE lsar_meta\.entity_behavior\s+SET allow_edit = (TRUE|FALSE)\s+WHERE entity_code IN \(([^)]*)\);/);
  assert.ok(update, 'expected scoped edit-only UPDATE');
  const scope = new Set(quoted(update[2]));
  for (const row of Object.values(rows)) {
    if (scope.has(row.entity_code)) row.allow_edit = update[1] === 'TRUE';
  }
}
applyEditMigration(editSql, behaviors);

test('all seven relationship mappings match the approved source rules', () => {
  const xb = keys.XB;
  const expected = [
    ['XB', 'XA', ['EIACODXA'], ['EIACODXA']],
    ['XC', 'XB', xb, xb],
    ['HG', 'XB', xb, xb],
    ['HO', 'HG', ['EIACODXA', 'ALTLCNHO', 'LSACONHO', 'LCNTYPXB', 'CAGECDHO', 'REFNUMHO'], keys.HG],
    ['HO', 'XC', ['EIACODXA', 'ALCSEIHO', 'LCNSEIHO', 'LCNTYPXB'], xb],
    ['XF', 'XB', ['EIACODXA', 'ALTLCNXF', 'LSACONXF', 'LCNTYPXF'], xb],
    ['XF', 'XC', ['EIACODXA', 'ALCSEIXF', 'LCNSEIXF', 'LTYSEIXF'], xb],
  ];
  assert.deepEqual(relationships.map(r => [r.child_entity_code.replace('WESCAM_', ''),
    r.parent_entity_code.replace('WESCAM_', ''), r.fk_columns, r.pk_columns]), expected);
});

function format(type) {
  return type.startsWith('character varying') ? type.replace('character varying', 'string') : type;
}
let catalogQueries = 0;
globalThis.__wescamTestPool = { async query(sql, params) {
  const code = params[0];
  const name = typeof code === 'string' ? code.replace('WESCAM_', '') : null;
  let rows;
  if (sql.includes('FROM lsar_meta.entity\n')) {
    rows = [{ entity_code: code, entity_uid: code, entity_name: code, include_entity: true,
      profile_code: 'WESCAM_OPUS' }];
  } else if (sql.includes('FROM lsar_meta.field_def f')) {
    rows = source[name].map(({ name: column, type }, i) => {
      const anchor = relationships.find(r => r.child_entity_code === code && r.lookup_anchor_column === column);
      return { field_def_id: String(i + 1), field_uid: `${code}-${column}`, column_name: column,
        ordinal_pos: i + 1, display_name: `EAGLE ${column}`, format_spec: format(type),
        is_key: keys[name].includes(column), is_mandatory: keys[name].includes(column),
        is_foreign: relationships.some(r => r.child_entity_code === code && r.fk_columns.includes(column)),
        include_element: true, deprecated: false, normalized_mapping_count: 0,
        behavior_hidden: false, behavior_read_only: null, behavior_required: null,
        behavior_form_section_id: null, control_type: anchor ? 'lookup' : null,
        display_label: anchor?.relationship_label ?? null };
    });
  } else if (sql.includes('FROM lsar_meta.form_definition')) rows = [];
  else if (sql.includes('FROM lsar_meta.entity_relationship')) {
    rows = relationships.filter(r => r.child_entity_code === code || r.parent_entity_code === code);
  } else if (sql.includes('FROM lsar_meta.entity_behavior')) {
    rows = Array.isArray(code) ? code.map(c => behaviors[c]) : [behaviors[code]];
  } else if (sql.includes('FROM pg_class c')) {
    assert.match(sql, /n\.nspname = 'lsar_core'/);
    assert.match(sql, /upper\(c\.relname\) = \$1/);
    catalogQueries++;
    assert.ok(entitiesSql.includes(`CREATE TABLE lsar_core."${code}"`));
    rows = [{ schema_name: 'lsar_core', table_name: code, estimated_rows: null }];
  } else if (sql.includes('FROM lsar_meta.field_presentation')) rows = [];
  else throw new Error(`Unexpected metadata query: ${sql}`);
  return { rows };
} };

function moduleUrl(text) {
  return `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
}
const poolUrl = moduleUrl('export const pool = globalThis.__wescamTestPool;');
const metadataUrl = moduleUrl(stripTypeScriptTypes(read('../lib/compiler/metadata.ts'))
  .replace('"@/lib/db"', JSON.stringify(poolUrl)));
const previewUrl = moduleUrl(stripTypeScriptTypes(read('../lib/compiler/preview.ts'))
  .replace('"@/lib/compiler/metadata"', JSON.stringify(metadataUrl))
  .replace('"@/lib/compiler/lookup-plan"', JSON.stringify(new URL('../lib/compiler/lookup-plan.ts', import.meta.url).href)));
const { buildEntityPreview } = await import(previewUrl);

for (const [name, columns] of Object.entries(source)) {
  test(`${name}: exact source DDL and key preserved`, () => {
    const body = entitiesSql.match(new RegExp(`CREATE TABLE lsar_core\."WESCAM_${name}" \\(\\n([\\s\\S]*?)\\n\\);`))[1];
    const actual = [...body.matchAll(/^    "([^"]+)" (.*?)(?:,)?$/gm)].map(m => ({ name: m[1], type: m[2] }));
    assert.deepEqual(actual, columns);
    const pk = body.match(/PRIMARY KEY \((.*?)\)/)[1];
    assert.deepEqual([...pk.matchAll(/"([^"]+)"/g)].map(m => m[1]), keys[name]);
    assert.ok(columns.some(c => c.name === 'USERIDZU'));
    assert.ok(columns.some(c => c.name === 'Filter'));
    for (const list of ['default_list_columns', 'default_search_columns', 'lookup_display_columns']) {
      assert.ok(behaviors[`WESCAM_${name}`][list].every(c => columns.some(f => f.name === c)));
    }
  });

  test(`${name}: actual compiler resolves table, all fields, keys, permissions and lookup plan`, async () => {
    const code = `WESCAM_${name}`;
    const preview = await buildEntityPreview(code);
    assert.deepEqual(preview.database, { schemaName: 'lsar_core', tableName: code,
      tableExists: true, estimatedRows: null });
    assert.equal(preview.entity.profileCode, 'WESCAM_OPUS');
    assert.equal(preview.summary.keyFieldCount, keys[name].length);
    assert.equal(preview.summary.mandatoryFieldCount, keys[name].length);
    assert.equal(preview.behavior.allowCreate, true);
    assert.equal(preview.behavior.allowEdit, true);
    assert.equal(preview.behavior.allowDelete, false);
    assert.equal(preview.behavior.allowImport, false);
    const fields = preview.gui.form.sections.flatMap(s => s.fields);
    assert.deepEqual(fields.map(f => f.columnName), columns.map(c => c.name));
    assert.deepEqual(fields.map(f => f.formatSpec), columns.map(c => format(c.type)));
    assert.equal(preview.gui.form.formCode, 'generated');
    const outgoing = preview.relationships.filter(r => r.childEntityCode === code);
    assert.deepEqual(preview.gui.lookupPlan, planLookupAnchors(outgoing, new Set(columns.map(c => c.name))));
    assert.ok(preview.gui.lookupPlan.every(e => e.diagnostic === null));
    assert.equal(fields.filter(f => f.lookup).length, outgoing.length);
    if (name === 'HO' || name === 'XF') {
      const expected = name === 'HO' ? [['WESCAM_HG', 'EIACODXA'], ['WESCAM_XC', 'ALCSEIHO']]
        : [['WESCAM_XB', 'LSACONXF'], ['WESCAM_XC', 'LCNSEIXF']];
      assert.deepEqual(fields.filter(f => f.lookup).map(f => [f.lookup.parentEntityCode, f.columnName]).sort(), expected.sort());
      const lookup = fields.find(f => f.lookup?.parentEntityCode === 'WESCAM_XC').lookup;
      assert.deepEqual(lookup.contextFilters, name === 'HO' ? [
        { column: 'EIACODXA', sourceColumn: 'EIACODXA' },
        { column: 'LCNTYPXB', sourceColumn: 'LCNTYPXB' },
      ] : [{ column: 'EIACODXA', sourceColumn: 'EIACODXA' }]);
    }
    if (name === 'THA' || name === 'THG' || name === 'HA') assert.equal(outgoing.length, 0);
    if (name === 'THG') {
      for (const column of ['PRSMINYH', 'PRSMAXYH']) {
        const field = fields.find(f => f.columnName === column);
        assert.equal(field.validation.precision, 2);
        assert.equal(field.validation.scale, 2);
      }
    }
  });
}

test('migrations are isolated, transactional, and omit physical inter-table FKs', () => {
  assert.equal(relationships.length, 7);
  for (const sql of [entitiesSql, presentationSql]) {
    assert.match(sql, /^BEGIN;/);
    assert.match(sql, /COMMIT;\s*$/);
    assert.match(sql, /current_database\(\) <> 'open_lsar'/);
  }
  assert.doesNotMatch(entitiesSql, /REFERENCES|ADD CONSTRAINT.*FOREIGN KEY/i);
  assert.match(entitiesSql, /e\.profile_code = 'BASELINE'/);
  assert.match(entitiesSql, /format_type\(a\.atttypid, a\.atttypmod\)/);
  assert.match(entitiesSql, /COALESCE\(NULLIF\(b\.element_name, ''\), 'EAGLE ' \|\| p\.column_name\)/);
  assert.equal(Object.keys(behaviors).length, 9);
  assert.match(presentationSql, /show_in_navigation/);
  assert.ok(presentationSql.split('\n').filter(l => l.startsWith("('WESCAM_")).every(l => /\d+, TRUE,/.test(l)));
  assert.equal(catalogQueries, 9);
});

test('generated navigation respects metadata visibility without an entity allowlist', () => {
  const page = read('../app/lsar/page.tsx');
  assert.match(page, /e\.include_entity AND b\.active AND b\.show_in_navigation/);
  assert.match(page, /ORDER BY b\.navigation_order NULLS LAST, e\.entity_code/);
  assert.match(page, /encodeURIComponent\(entity\.entity_code\)/);
  assert.doesNotMatch(page, /BASELINE|WESCAM|entity_code IN/);
});

test('loader fixes database/table scope, protects replacement, and asserts snapshot counts before commit', () => {
  const loader = read('../scripts/wescam-opus-load');
  assert.match(loader, /set -euo pipefail/);
  assert.match(loader, /container=oslar-dev-postgres/);
  assert.match(loader, /tables=\(XA XB XC HA HG HO THA THG XF\)/);
  assert.match(loader, /REPEATABLE READ READ ONLY/);
  assert.match(loader, /--replace\) replace=true/);
  assert.match(loader, /TRUNCATE TABLE lsar_core\.\\"WESCAM_\$table/);
  assert.match(loader, /source_copy "\$table" \|/);
  assert.match(loader, /psql_db open_lsar -1/);
  assert.match(loader, /IF actual <> \$source_count THEN/);
  assert.equal((loader.match(/FORMAT binary/g) ?? []).length, 2);
});


test('043 and rollback change only edit permission for exactly the nine Wescam entities', () => {
  const expected = Object.keys(keys).map(name => `WESCAM_${name}`).sort();
  for (const [sql, enabled] of [[editSql, true], [editDownSql, false]]) {
    assert.match(sql, /^BEGIN;/);
    assert.match(sql, /COMMIT;\s*$/);
    assert.match(sql, /current_database\(\) <> 'open_lsar'/);
    assert.match(sql, /GET DIAGNOSTICS affected_rows = ROW_COUNT;/);
    assert.match(sql, /IF affected_rows <> 9 THEN/);
    assert.equal((sql.match(/\bUPDATE\b/g) ?? []).length, 1);
    assert.doesNotMatch(sql, /\b(?:INSERT|DELETE|ALTER|CREATE|DROP|TRUNCATE)\b/);
    const update = sql.match(/UPDATE lsar_meta\.entity_behavior\s+SET ([\s\S]*?)\s+WHERE entity_code IN \(([^)]*)\);/);
    assert.equal(update[1], `allow_edit = ${enabled ? 'TRUE' : 'FALSE'}`);
    assert.deepEqual(quoted(update[2]).sort(), expected);
  }
  const baseline = {
    XA: { entity_code: 'XA', allow_create: true, allow_edit: false, allow_delete: false, allow_import: false },
    XB: { entity_code: 'XB', allow_create: true, allow_edit: true, allow_delete: true, allow_import: true },
  };
  const before = structuredClone(baseline);
  const rows = { ...structuredClone(behaviors), ...baseline };
  applyEditMigration(editSql, rows);
  for (const code of expected) assert.deepEqual(rows[code], { ...behaviors[code], allow_edit: true });
  assert.deepEqual({ XA: rows.XA, XB: rows.XB }, before);
  applyEditMigration(editDownSql, rows);
  for (const code of expected) assert.deepEqual(rows[code], { ...behaviors[code], allow_edit: false });
  assert.deepEqual({ XA: rows.XA, XB: rows.XB }, before);
});

test('list Edit actions follow metadata for any entity', () => {
  const page = read('../app/lsar/entities/[entity]/page.tsx');
  assert.doesNotMatch(page, /WESCAM/);
  assert.match(page, /preview\.behavior\?\.allowEdit && \(\s*<Link[\s\S]*?buildEditHref[\s\S]*?>\s*Edit\s*<\/Link>/);
  const condition = page.match(/\{(preview\.behavior\?\.allowEdit) && \(\s*<Link/)[1];
  const showEdit = new Function('preview', `return Boolean(${condition});`);
  for (const code of ['BASELINE_TEST', ...Object.keys(behaviors)]) {
    assert.equal(showEdit({ entity: { entityCode: code }, behavior: { allowEdit: true } }), true);
    assert.equal(showEdit({ entity: { entityCode: code }, behavior: { allowEdit: false } }), false);
  }
});

test('edit mode keeps every Wescam key read-only and permits ordinary non-key fields', () => {
  const form = read('../components/compiler/generated-form.tsx');
  const expression = form.match(/const effectiveReadOnly =([\s\S]*?);/)[1];
  const readOnly = new Function('mode', 'field', 'keyColumns', 'lookupCompanionColumns', `return (${expression});`);
  for (const [name, columns] of Object.entries(source)) {
    for (const column of columns) {
      const field = { columnName: column.name, readOnly: false, validation: { required: false } };
      assert.equal(readOnly('edit', field, keys[name], new Set()), keys[name].includes(column.name));
      assert.equal(readOnly('edit', { ...field, readOnly: true }, keys[name], new Set()), true);
    }
  }
  assert.match(form, /readOnly=\{\s*mode === "view" \|\|\s*\(mode === "edit" &&\s*\(keyColumns\.includes\(field\.columnName\) \|\| field\.readOnly\)\)/);
  assert.match(form, /disabled=\{effectiveReadOnly\}/);
  const update = read('../lib/compiler/update.ts');
  assert.match(update, /Primary-key field \$\{column\} cannot be changed during edit/);
  assert.match(update, /!field\.readOnly &&\s*!keyColumns\.includes\(field\.columnName\)/);
});
