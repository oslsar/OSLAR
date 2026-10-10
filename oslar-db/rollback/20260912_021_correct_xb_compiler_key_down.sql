BEGIN;

UPDATE lsar_meta.field_def
SET
    is_key = false,
    is_foreign = true
WHERE entity_code = 'XB'
  AND column_name = 'EIACODXA';

COMMIT;
