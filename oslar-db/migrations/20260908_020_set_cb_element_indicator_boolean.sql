BEGIN;

UPDATE lsar_meta.field_behavior fb
SET
    control_type = 'boolean',
    updated_at = now()
FROM lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'CB'
  AND fd.column_name = 'ELEMNTCB';

COMMIT;
