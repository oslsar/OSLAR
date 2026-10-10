BEGIN;

-- ============================================================================
-- Correct CA composite primary key.
--
-- A CA task is identified by its parent XB identity plus TASKCDCA:
--
--   EIACODXA
--   ALTLCNXB
--   LSACONXB
--   LCNTYPXB
--   TASKCDCA
-- ============================================================================

-- All primary-key components must be NOT NULL.
ALTER TABLE lsar_core."CA"
  ALTER COLUMN "EIACODXA" SET NOT NULL,
  ALTER COLUMN "ALTLCNXB" SET NOT NULL,
  ALTER COLUMN "LSACONXB" SET NOT NULL,
  ALTER COLUMN "LCNTYPXB" SET NOT NULL;

-- Replace TASKCDCA-only primary key.
ALTER TABLE lsar_core."CA"
  DROP CONSTRAINT "CA_PK";

ALTER TABLE lsar_core."CA"
  ADD CONSTRAINT "CA_PK"
  PRIMARY KEY (
    "EIACODXA",
    "ALTLCNXB",
    "LSACONXB",
    "LCNTYPXB",
    "TASKCDCA"
  );

-- The inherited XB identity columns are also components
-- of the CA primary key.
UPDATE lsar_meta.field_def
SET
  is_key = true,
  is_mandatory = true
WHERE entity_code = 'CA'
  AND column_name IN (
    'EIACODXA',
    'ALTLCNXB',
    'LSACONXB',
    'LCNTYPXB'
  );

COMMIT;