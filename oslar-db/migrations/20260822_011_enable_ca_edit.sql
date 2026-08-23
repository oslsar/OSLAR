BEGIN;

UPDATE lsar_meta.entity_behavior
SET
  allow_edit = true,
  updated_at = now()
WHERE entity_code = 'CA';

COMMIT;
