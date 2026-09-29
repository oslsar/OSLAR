BEGIN;

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'XB'
  AND constraint_name = 'fk_hg__xb';

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'HA'
  AND constraint_name = 'fk_hg__ha';

ALTER TABLE lsar_core."HG"
    DROP CONSTRAINT IF EXISTS "HG_PK";

ALTER TABLE lsar_core."HG"
    ALTER COLUMN "EIACODXA" DROP NOT NULL,
    ALTER COLUMN "ALTLCNXB" DROP NOT NULL,
    ALTER COLUMN "LSACONXB" DROP NOT NULL,
    ALTER COLUMN "LCNTYPXB" DROP NOT NULL,
    ALTER COLUMN "CAGECDXH" DROP NOT NULL,
    ALTER COLUMN "REFNUMHA" DROP NOT NULL;

UPDATE lsar_meta.field_def
SET
    is_key = FALSE,
    is_foreign = TRUE,
    is_mandatory = FALSE
WHERE entity_code = 'HG'
  AND column_name IN
  (
      'EIACODXA',
      'ALTLCNXB',
      'LSACONXB',
      'LCNTYPXB',
      'CAGECDXH',
      'REFNUMHA'
  );

COMMIT;
