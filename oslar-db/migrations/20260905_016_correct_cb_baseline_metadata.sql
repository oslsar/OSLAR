BEGIN;

-- ============================================================================
-- 016 - Correct CB baseline metadata and physical schema
--
-- Correct CB hierarchy:
--
-- XA [EIACODXA]
--   -> XB [EIACODXA, LSACONXB, ALTLCNXB, LCNTYPXB]
--      -> CA [..., TASKCDCA]
--         -> CB [..., TASKCDCA, SUBNUMCB]
--
-- CB primary key:
--   EIACODXA, LSACONXB, ALTLCNXB, LCNTYPXB, TASKCDCA, SUBNUMCB
--
-- The first five columns form the inherited CB -> CA relationship.
-- ============================================================================


-- ============================================================================
-- 1. Repair raw source metadata
-- ============================================================================

-- TSKSTNCB is an incorrect field name for the CB Subtask Number.
UPDATE lsar_meta.dbinfo_raw
SET
    field = 'SUBNUMCB',
    geia_short_name = 'subtano',
    element_name = 'Subtask Number',
    format_spec = 'integer(3)',
    key = 'P',
    is_key = TRUE,
    is_foreign = FALSE,
    is_mandatory = TRUE
WHERE entity_code = 'CB'
  AND ordinal_pos = '6';


-- Correct referenced-subtask field definitions.
UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'string(10)'
WHERE entity_code = 'CB'
  AND field = 'RFDEIACB';

UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'string(18)'
WHERE entity_code = 'CB'
  AND field = 'RFDLCNCB';

UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'string(2)'
WHERE entity_code = 'CB'
  AND field = 'RFDALCCB';

UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'string(1)'
WHERE entity_code = 'CB'
  AND field = 'RFDTYPCB';

UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'string(7)'
WHERE entity_code = 'CB'
  AND field = 'RFDTCDCB';

UPDATE lsar_meta.dbinfo_raw
SET format_spec = 'integer(3)'
WHERE entity_code = 'CB'
  AND field = 'RFDSUBCB';


-- Ordinal 14 was incorrectly imported using the SUBTIDCB field name.
-- It is the Subtask Description field.
UPDATE lsar_meta.dbinfo_raw
SET
    field = 'SUBTDECB',
    geia_short_name = 'subtdesc',
    element_name = 'Subtask Description',
    format_spec = 'string(unlimited)'
WHERE entity_code = 'CB'
  AND ordinal_pos = '14';


-- Ordinal 15 is the actual Subtask Identification field.
UPDATE lsar_meta.dbinfo_raw
SET
    field = 'SUBTIDCB',
    geia_short_name = 'subtaid',
    element_name = 'Subtask Identification',
    format_spec = 'string(36)'
WHERE entity_code = 'CB'
  AND ordinal_pos = '15';


-- Correct work-area access field.
UPDATE lsar_meta.dbinfo_raw
SET
    field = 'SUBWACCB',
    geia_short_name = 'subtwaca',
    element_name = 'Subtask Work Area Code Access',
    format_spec = 'string(5)'
WHERE entity_code = 'CB'
  AND ordinal_pos = '17';


-- ============================================================================
-- 2. Repair normalized compiler field metadata
-- ============================================================================

UPDATE lsar_meta.field_def
SET
    column_name = 'SUBNUMCB',
    geia_short_name = 'subtano',
    element_name = 'Subtask Number',
    format_spec = 'integer(3)',
    key_class = 'P',
    is_key = TRUE,
    is_foreign = FALSE,
    is_mandatory = TRUE
WHERE entity_code = 'CB'
  AND ordinal_pos = 6;


UPDATE lsar_meta.field_def
SET format_spec = 'string(10)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDEIACB';

UPDATE lsar_meta.field_def
SET format_spec = 'string(18)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDLCNCB';

UPDATE lsar_meta.field_def
SET format_spec = 'string(2)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDALCCB';

UPDATE lsar_meta.field_def
SET format_spec = 'string(1)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDTYPCB';

UPDATE lsar_meta.field_def
SET format_spec = 'string(7)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDTCDCB';

UPDATE lsar_meta.field_def
SET format_spec = 'integer(3)'
WHERE entity_code = 'CB'
  AND column_name = 'RFDSUBCB';


-- Ordinal 14 is Subtask Description.
UPDATE lsar_meta.field_def
SET
    column_name = 'SUBTDECB',
    geia_short_name = 'subtdesc',
    element_name = 'Subtask Description',
    format_spec = 'string(unlimited)'
WHERE entity_code = 'CB'
  AND ordinal_pos = 14;


-- Ordinal 15 was lost from normalized metadata because the malformed raw
-- source duplicated SUBTIDCB. Re-create it if it is not already present.
INSERT INTO lsar_meta.field_def
(
    entity_code,
    column_name,
    ordinal_pos,
    element_name,
    geia_short_name,
    format_spec,
    key_class,
    is_key,
    is_foreign,
    is_mandatory,
    originates_in_entity
)
SELECT
    'CB',
    'SUBTIDCB',
    15,
    'Subtask Identification',
    'subtaid',
    'string(36)',
    'I',
    FALSE,
    FALSE,
    FALSE,
    '0'
WHERE NOT EXISTS
(
    SELECT 1
    FROM lsar_meta.field_def
    WHERE entity_code = 'CB'
      AND column_name = 'SUBTIDCB'
      AND ordinal_pos = 15
);

-- SUBWACCB is a valid CB field. It was previously retained as a
-- deprecated legacy field, so restore it to the active baseline.
UPDATE lsar_meta.field_def
SET
    column_name = 'SUBWACCB',
    ordinal_pos = 17,
    element_name = 'Subtask Work Area Code Access',
    geia_short_name = 'subtwaca',
    format_spec = 'string(5)',
    key_class = '0',
    is_key = FALSE,
    is_foreign = FALSE,
    is_mandatory = FALSE,
    include_element = TRUE,
    deprecated = FALSE,
    originates_in_entity = '0'
WHERE entity_code = 'CB'
  AND column_name = 'SUBWACCB';

-- ============================================================================
-- 3. Repair physical CB schema
-- ============================================================================

-- CB is currently empty, so changing the primary key is safe.
ALTER TABLE lsar_core."CB"
    DROP CONSTRAINT IF EXISTS "fk_cb__ca";
ALTER TABLE lsar_core."CB"
    DROP CONSTRAINT IF EXISTS "CB_PK";


-- SUBWACCB exists in the authoritative CB definition but was omitted
-- physically.
ALTER TABLE lsar_core."CB"
    ADD COLUMN IF NOT EXISTS "SUBWACCB" varchar(5);

ALTER TABLE lsar_core."CB"
    ALTER COLUMN "RFDTYPCB" TYPE varchar(1);

ALTER TABLE lsar_core."CB"
    ALTER COLUMN "RFDTCDCB" TYPE varchar(7);

-- The six-column CB primary key.
ALTER TABLE lsar_core."CB"
    ADD CONSTRAINT "CB_PK"
    PRIMARY KEY
    (
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB",
        "TASKCDCA",
        "SUBNUMCB"
    );

ALTER TABLE lsar_core."CB"
    ADD CONSTRAINT "fk_cb__ca"
    FOREIGN KEY
    (
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB",
        "TASKCDCA"
    )
    REFERENCES lsar_core."CA"
    (
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB",
        "TASKCDCA"
    );

-- ============================================================================
-- 4. Ensure inherited CB key metadata is represented as key + foreign
-- ============================================================================

UPDATE lsar_meta.field_def
SET
    is_key = TRUE,
    is_foreign = TRUE,
    key_class = 'F'
WHERE entity_code = 'CB'
  AND column_name IN
  (
      'EIACODXA',
      'LSACONXB',
      'ALTLCNXB',
      'LCNTYPXB',
      'TASKCDCA'
  );


UPDATE lsar_meta.dbinfo_raw
SET
    is_key = TRUE,
    is_foreign = TRUE,
    key = 'F'
WHERE entity_code = 'CB'
  AND field IN
  (
      'EIACODXA',
      'LSACONXB',
      'ALTLCNXB',
      'LCNTYPXB',
      'TASKCDCA'
  );

-- ============================================================================
-- 5. Register CB -> CA relationship metadata
-- ============================================================================

INSERT INTO lsar_meta.entity_relationship
(
    child_entity_code,
    parent_entity_code,
    constraint_name,
    relationship_type,
    fk_columns,
    pk_columns,
    active,
    comments
)
VALUES
(
    'CB',
    'CA',
    'fk_cb__ca',
    'foreign_key',
    '["EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB", "TASKCDCA"]'::jsonb,
    '["EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB", "TASKCDCA"]'::jsonb,
    TRUE,
    'CB belongs to CA using composite key'
)
ON CONFLICT
(
    child_entity_code,
    parent_entity_code,
    constraint_name
)
DO UPDATE SET
    relationship_type = EXCLUDED.relationship_type,
    fk_columns = EXCLUDED.fk_columns,
    pk_columns = EXCLUDED.pk_columns,
    active = EXCLUDED.active,
    comments = EXCLUDED.comments;

COMMIT;
