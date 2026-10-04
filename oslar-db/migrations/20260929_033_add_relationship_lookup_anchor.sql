BEGIN;

-- ============================================================================
-- Allow a relationship lookup to be rendered on a child FK column other than
-- the first FK column.
--
-- NULL means:
--     use fk_columns[0]
--
-- This is required for relationships such as HG where multiple parents share
-- EIACODXA but need separate lookup controls.
-- ============================================================================

ALTER TABLE lsar_meta.entity_relationship
    ADD COLUMN lookup_anchor_column text;

COMMENT ON COLUMN lsar_meta.entity_relationship.lookup_anchor_column IS
    'Child FK column that hosts the lookup control. NULL uses the first fk_columns entry.';

ALTER TABLE lsar_meta.entity_relationship
    ADD CONSTRAINT entity_relationship_lookup_anchor_in_fk_chk
    CHECK
    (
        lookup_anchor_column IS NULL
        OR fk_columns ? lookup_anchor_column
    );


-- HG -> XB
-- Parent LCN selection owns EIACODXA and supplies the XB composite key.

UPDATE lsar_meta.entity_relationship
SET lookup_anchor_column = 'EIACODXA'
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'XB'
  AND constraint_name = 'fk_hg__xb';


-- HG -> HA
-- Applied Part needs its own lookup control.
-- EIACODXA remains shared End Item context and must not be independently
-- selected by this relationship.

UPDATE lsar_meta.entity_relationship
SET lookup_anchor_column = 'CAGECDXH'
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'HA'
  AND constraint_name = 'fk_hg__ha';

COMMIT;
