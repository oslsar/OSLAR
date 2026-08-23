BEGIN;

UPDATE lsar_meta.entity_behavior
SET
  allow_edit = false,
  updated_at = now()
WHERE entity_code = 'CA';

COMMIT;
