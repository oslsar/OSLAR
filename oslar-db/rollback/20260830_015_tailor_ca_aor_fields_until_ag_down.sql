BEGIN;

-- Restore the two normalized rows to their pre-015 state.
UPDATE lsar_meta.field_def
SET
  is_foreign = false,
  is_mandatory = false,
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND column_name IN (
    'AORALCCA',
    'AORLCNCA'
  );

-- Restore matching raw rows.
UPDATE lsar_meta.dbinfo_raw
SET
  is_foreign = 'FALSE',
  is_mandatory = 'FALSE',
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND ordinal_pos IN ('11', '12')
  AND field IN ('AORALCCA', 'AORLCNCA');

-- AORTYPCA already had a field_behavior row before Migration 015.
-- Return its required override to NULL so baseline inference resumes.
UPDATE lsar_meta.field_behavior fb
SET
  required = NULL,
  updated_at = now()
FROM lsar_meta.field_def fd
WHERE fb.field_def_id = fd.field_def_id
  AND fd.entity_code = 'CA'
  AND fd.column_name = 'AORTYPCA';

-- The other three behaviour rows were introduced by Migration 015.
DELETE FROM lsar_meta.field_behavior fb
USING lsar_meta.field_def fd
WHERE fb.field_def_id = fd.field_def_id
  AND fd.entity_code = 'CA'
  AND fd.column_name IN (
    'AORALCCA',
    'AORLCNCA',
    'AORMSBAG'
  );

COMMIT;
