// Inspect the real SQL and simulate its sole UPDATE in memory; never connects to a database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const codes = ['XA', 'XB', 'XC', 'XH', 'HA', 'HG', 'HO', 'CA', 'CB'];
for (const [directory, suffix, enabled] of [['migrations', '', true], ['rollback', '_down', false]]) {
  test(`045 ${directory} changes exactly nine allow_delete values and preserves unrelated behavior`, () => {
    const sql = readFileSync(new URL(`../oslar-db/${directory}/20261012_045_enable_baseline_delete${suffix}.sql`, import.meta.url), 'utf8');
    assert.match(sql, /^BEGIN;[\s\S]*COMMIT;\s*$/);
    assert.match(sql, /IF current_database\(\) <> 'open_lsar' THEN\s+RAISE EXCEPTION/);
    assert.match(sql, /GET DIAGNOSTICS affected_rows = ROW_COUNT;/);
    assert.match(sql, /IF affected_rows <> 9 THEN\s+RAISE EXCEPTION/);
    const update = sql.match(/UPDATE lsar_meta\.entity_behavior\s+SET allow_delete = (TRUE|FALSE)\s+WHERE entity_code IN \(([^)]+)\);/);
    assert.ok(update);
    assert.equal(update[1], enabled ? 'TRUE' : 'FALSE');
    const targets = update[2].split(',').map(value => value.trim().replace(/^'|'$/g, ''));
    assert.deepEqual(targets, codes);
    assert.equal(new Set(targets).size, 9);
    // Reject any additional SQL mutation, permission assignment or entity target.
    const remainder = sql.replace(update[0], '').replace(/'(?:''|[^'])*'/g, "''");
    assert.doesNotMatch(remainder, /\b(?:UPDATE|INSERT|DELETE|MERGE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE)\b/i);
    assert.doesNotMatch(sql, /allow_(?:create|edit|import|export)|WESCAM/i);
    const rows = [...codes, 'UNRELATED'].map(entity_code => ({ entity_code, allow_delete: !enabled,
      allow_create: true, allow_edit: false, allow_import: true, allow_export: false, navigation_label: entity_code }));
    const before = structuredClone(rows);
    let affected = 0;
    for (const row of rows) if (targets.includes(row.entity_code)) { row.allow_delete = enabled; affected++; }
    assert.equal(affected, 9);
    assert.deepEqual(rows, before.map(row => codes.includes(row.entity_code) ? { ...row, allow_delete: enabled } : row));
    assert.deepEqual(rows.at(-1), before.at(-1));
  });
}
