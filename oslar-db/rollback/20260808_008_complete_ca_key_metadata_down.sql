BEGIN;

DELETE FROM lsar_meta.field_def
WHERE entity_code = 'CA'
  AND column_name IN (
    'LSACONXB',
    'LCNTYPXB',
    'TASKCDCA'
  );

COMMIT;
