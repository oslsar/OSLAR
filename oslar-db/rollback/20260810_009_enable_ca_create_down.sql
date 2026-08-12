BEGIN;

DELETE FROM lsar_meta.entity_behavior
WHERE entity_code = 'CA';

COMMIT;

