BEGIN;

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'XC'
  AND parent_entity_code = 'XB'
  AND constraint_name = 'fk_xc__xb';

UPDATE lsar_meta.field_def
SET
  is_key = false,
  is_foreign = true,
  is_mandatory = false
WHERE entity_code = 'XC'
  AND column_name IN (
    'EIACODXA',
    'ALTLCNXB',
    'LSACONXB',
    'LCNTYPXB'
  );

ALTER TABLE lsar_core."XC"
  DROP CONSTRAINT IF EXISTS "XC_PK";

ALTER TABLE lsar_core."XC"
  ALTER COLUMN "EIACODXA" DROP NOT NULL,
  ALTER COLUMN "ALTLCNXB" DROP NOT NULL,
  ALTER COLUMN "LSACONXB" DROP NOT NULL,
  ALTER COLUMN "LCNTYPXB" DROP NOT NULL;

COMMIT;
