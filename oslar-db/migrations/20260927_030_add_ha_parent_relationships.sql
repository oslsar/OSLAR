BEGIN;

-- ============================================================================
-- HA parent relationships.
--
-- HA = Parts Library
--
-- HA identity:
--   EIACODXA
--   CAGECDXH
--   REFNUMHA
--
-- Parent lookups:
--   EIACODXA -> XA.EIACODXA
--   CAGECDXH -> XH.CAGECDXH
--
-- These are compiler/metadata foreign-key relationships.
-- Physical PostgreSQL foreign keys are intentionally not added here.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- HA -> XA
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
    'HA',
    'XA',
    'fk_ha__xa',
    'foreign_key',
    'End Item',
    '["EIACODXA"]'::jsonb,
    '["EIACODXA"]'::jsonb,
    NULL,
    TRUE,
    'HA part records belong to an XA End Item.'
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
-- HA -> XH
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
    'HA',
    'XH',
    'fk_ha__xh',
    'foreign_key',
    'Vendor / CAGE',
    '["CAGECDXH"]'::jsonb,
    '["CAGECDXH"]'::jsonb,
    NULL,
    TRUE,
    'HA part records reference an XH Commercial and Government Entity by CAGE code.'
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
