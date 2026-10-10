BEGIN;

-- ============================================================================
-- Correct HG identity and parent relationships.
--
-- HG = Part Application / Position
--
-- HG joins:
--
--   XB Logistics Structure
--     EIACODXA
--     ALTLCNXB
--     LSACONXB
--     LCNTYPXB
--
--   HA Parts Library
--     EIACODXA
--     CAGECDXH
--     REFNUMHA
--
-- EIACODXA is shared by both parents, producing a six-column HG identity:
--
--   EIACODXA
--   ALTLCNXB
--   LSACONXB
--   LCNTYPXB
--   CAGECDXH
--   REFNUMHA
--
-- Physical PostgreSQL foreign keys are intentionally not added here.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Physical HG identity
-- ---------------------------------------------------------------------------

ALTER TABLE lsar_core."HG"
    ALTER COLUMN "EIACODXA" SET NOT NULL,
    ALTER COLUMN "ALTLCNXB" SET NOT NULL,
    ALTER COLUMN "LSACONXB" SET NOT NULL,
    ALTER COLUMN "LCNTYPXB" SET NOT NULL,
    ALTER COLUMN "CAGECDXH" SET NOT NULL,
    ALTER COLUMN "REFNUMHA" SET NOT NULL;

ALTER TABLE lsar_core."HG"
    ADD CONSTRAINT "HG_PK"
    PRIMARY KEY
    (
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB",
        "CAGECDXH",
        "REFNUMHA"
    );


-- ---------------------------------------------------------------------------
-- 2. Correct compiler key metadata
-- ---------------------------------------------------------------------------

UPDATE lsar_meta.field_def
SET
    is_key = TRUE,
    is_foreign = TRUE,
    is_mandatory = TRUE
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


-- ---------------------------------------------------------------------------
-- 3. HG -> XB parent relationship
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.entity_relationship
(
    child_entity_code,
    parent_entity_code,
    constraint_name,
    relationship_type,
    relationship_label,
    fk_columns,
    pk_columns,
    lookup_filter,
    active,
    comments
)
VALUES
(
    'HG',
    'XB',
    'fk_hg__xb',
    'foreign_key',
    'Parent LCN',
    '[
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB"
    ]'::jsonb,
    '[
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB"
    ]'::jsonb,
    NULL,
    TRUE,
    'HG part application belongs to an XB logistics structure position.'
)
ON CONFLICT
(
    child_entity_code,
    parent_entity_code,
    constraint_name
)
DO UPDATE SET
    relationship_type  = EXCLUDED.relationship_type,
    relationship_label = EXCLUDED.relationship_label,
    fk_columns         = EXCLUDED.fk_columns,
    pk_columns         = EXCLUDED.pk_columns,
    lookup_filter      = EXCLUDED.lookup_filter,
    active             = EXCLUDED.active,
    comments           = EXCLUDED.comments;


-- ---------------------------------------------------------------------------
-- 4. HG -> HA applied-part relationship
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.entity_relationship
(
    child_entity_code,
    parent_entity_code,
    constraint_name,
    relationship_type,
    relationship_label,
    fk_columns,
    pk_columns,
    lookup_filter,
    active,
    comments
)
VALUES
(
    'HG',
    'HA',
    'fk_hg__ha',
    'foreign_key',
    'Applied Part',
    '[
        "EIACODXA",
        "CAGECDXH",
        "REFNUMHA"
    ]'::jsonb,
    '[
        "EIACODXA",
        "CAGECDXH",
        "REFNUMHA"
    ]'::jsonb,
    NULL,
    TRUE,
    'HG applies an HA Parts Library item to an XB logistics structure position.'
)
ON CONFLICT
(
    child_entity_code,
    parent_entity_code,
    constraint_name
)
DO UPDATE SET
    relationship_type  = EXCLUDED.relationship_type,
    relationship_label = EXCLUDED.relationship_label,
    fk_columns         = EXCLUDED.fk_columns,
    pk_columns         = EXCLUDED.pk_columns,
    lookup_filter      = EXCLUDED.lookup_filter,
    active             = EXCLUDED.active,
    comments           = EXCLUDED.comments;

COMMIT;
