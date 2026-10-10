BEGIN;

ALTER TABLE lsar_core."CA"
  DROP CONSTRAINT "CA_PK";

ALTER TABLE lsar_core."CA"
  ADD CONSTRAINT "CA_PK"
  PRIMARY KEY ("TASKCDCA");

ALTER TABLE lsar_core."CA"
  ALTER COLUMN "EIACODXA" DROP NOT NULL,
  ALTER COLUMN "ALTLCNXB" DROP NOT NULL,
  ALTER COLUMN "LSACONXB" DROP NOT NULL,
  ALTER COLUMN "LCNTYPXB" DROP NOT NULL;

UPDATE lsar_meta.field_def
SET
  is_key = false,
  is_mandatory =
    CASE
      WHEN column_name IN ('EIACODXA', 'ALTLCNXB')
        THEN true
      ELSE false
    END
WHERE entity_code = 'CA'
  AND column_name IN (
    'EIACODXA',
    'ALTLCNXB',
    'LSACONXB',
    'LCNTYPXB'
  );

COMMIT;