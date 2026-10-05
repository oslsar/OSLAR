BEGIN;

-- ============================================================================
-- Add BASELINE HO entity.
--
-- HO = Provisioning System/End Item Usable On Code.
--
-- HO relates an HG Part Application to an XC System/End Item UOC.
--
-- Primary key: all eight columns.
--
-- HO -> HG:
--   EIACODXA  -> EIACODXA
--   ALTLCNHO  -> ALTLCNXB
--   LSACONHO  -> LSACONXB
--   LCNTYPXB  -> LCNTYPXB
--   CAGECDHO  -> CAGECDXH
--   REFNUMHO  -> REFNUMHA
--
-- HO -> XC:
--   EIACODXA  -> EIACODXA
--   ALCSEIHO  -> ALTLCNXB
--   LCNSEIHO  -> LSACONXB
--   LCNTYPXB  -> LCNTYPXB
--
-- Physical PostgreSQL foreign keys are intentionally not created, matching
-- the existing compiler relationship pattern used by XC and HG.
--
-- DED numbers, titles and field lengths below are from MIL-STD-1388-2B.
-- Unverified cross-standard mapping columns are deliberately left NULL.
-- ============================================================================

DO $$
BEGIN
    IF to_regclass('lsar_core."HO"') IS NOT NULL THEN
        RAISE EXCEPTION 'lsar_core.HO already exists; migration cancelled';
    END IF;

    IF EXISTS (
        SELECT 1 FROM lsar_meta.entity
        WHERE entity_code = 'HO'
    ) THEN
        RAISE EXCEPTION 'HO entity metadata already exists; migration cancelled';
    END IF;

    IF EXISTS (
        SELECT 1 FROM lsar_meta.field_def
        WHERE entity_code = 'HO'
    ) THEN
        RAISE EXCEPTION 'HO field metadata already exists; migration cancelled';
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 1. BASELINE source metadata
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.dbinfo_raw
(
    tag,
    profile_code,
    entity_code,
    field,
    geia_short_name,
    element_name,
    format_spec,
    ded,
    giea,
    mil_1388_field,
    def_std_00_60,
    s3000l,
    ordinal_pos,
    key,
    is_key,
    is_foreign,
    is_mandatory,
    originates_in_entity,
    include_element,
    mandatory_override,
    deprecated,
    tailoring_notes,
    comments
)
VALUES
(
    'P1', 'BASELINE', 'HO',
    'EIACODXA', 'eiac',
    'End Item Acronym Code',
    'string(10)', '096',
    NULL, NULL, NULL, NULL,
    '1', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'LCNTYPXB', 'lcntype',
    'LCN Type',
    'string(1)', '203',
    NULL, NULL, NULL, NULL,
    '2', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'CAGECDHO', NULL,
    'UOC Provisioning CAGE Code',
    'string(5)', '046',
    NULL, NULL, NULL, NULL,
    '3', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'REFNUMHO', NULL,
    'UOC Provisioning Reference Number',
    'string(32)', '337',
    NULL, NULL, NULL, NULL,
    '4', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'LSACONHO', NULL,
    'UOC Provisioning LSA Control Number (LCN)',
    'string(18)', '199',
    NULL, NULL, NULL, NULL,
    '5', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'ALTLCNHO', NULL,
    'UOC Provisioning Alternate LCN Code (ALC)',
    'string(2)', '019',
    NULL, NULL, NULL, NULL,
    '6', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'LCNSEIHO', NULL,
    'UOC Provisioning System/EI LCN',
    'string(18)', '199',
    NULL, NULL, NULL, NULL,
    '7', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
),
(
    'P1', 'BASELINE', 'HO',
    'ALCSEIHO', NULL,
    'UOC Provisioning System/EI ALC',
    'string(2)', '019',
    NULL, NULL, NULL, NULL,
    '8', 'F',
    TRUE, TRUE, TRUE, '0',
    TRUE, FALSE, FALSE,
    NULL, NULL
);


-- ---------------------------------------------------------------------------
-- 2. Compiler entity metadata
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.entity
(
    entity_code,
    entity_name,
    source_tag,
    profile_code,
    include_entity,
    comments
)
VALUES
(
    'HO',
    'Table HO',
    'P1',
    'BASELINE',
    TRUE,
    'Provisioning System/End Item Usable On Code; relates HG Part Applications to XC System/End Item UOCs.'
);


-- ---------------------------------------------------------------------------
-- 3. Compiler field metadata
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.field_def
(
    entity_code,
    column_name,
    ordinal_pos,
    format_spec,
    ded,
    geia_short_name,
    element_name,
    mil_1388_field,
    def_std_00_60,
    s3000l,
    key_class,
    is_key,
    is_foreign,
    is_mandatory,
    originates_in_entity,
    include_element,
    mandatory_override,
    deprecated
)
VALUES
('HO','EIACODXA', 1,'string(10)','096','eiac',
 'End Item Acronym Code',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','LCNTYPXB', 2,'string(1)','203','lcntype',
 'LCN Type',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','CAGECDHO', 3,'string(5)','046',NULL,
 'UOC Provisioning CAGE Code',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','REFNUMHO', 4,'string(32)','337',NULL,
 'UOC Provisioning Reference Number',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','LSACONHO', 5,'string(18)','199',NULL,
 'UOC Provisioning LSA Control Number (LCN)',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','ALTLCNHO', 6,'string(2)','019',NULL,
 'UOC Provisioning Alternate LCN Code (ALC)',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','LCNSEIHO', 7,'string(18)','199',NULL,
 'UOC Provisioning System/EI LCN',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE),

('HO','ALCSEIHO', 8,'string(2)','019',NULL,
 'UOC Provisioning System/EI ALC',
 NULL,NULL,NULL,'F',TRUE,TRUE,TRUE,'0',TRUE,FALSE,FALSE);


-- ---------------------------------------------------------------------------
-- 4. Physical HO table
-- ---------------------------------------------------------------------------

CREATE TABLE lsar_core."HO"
(
    "EIACODXA" varchar(10) NOT NULL,
    "LCNTYPXB" varchar(1)  NOT NULL,
    "CAGECDHO" varchar(5)  NOT NULL,
    "REFNUMHO" varchar(32) NOT NULL,
    "LSACONHO" varchar(18) NOT NULL,
    "ALTLCNHO" varchar(2)  NOT NULL,
    "LCNSEIHO" varchar(18) NOT NULL,
    "ALCSEIHO" varchar(2)  NOT NULL,

    CONSTRAINT "HO_PK"
        PRIMARY KEY
        (
            "EIACODXA",
            "LCNTYPXB",
            "CAGECDHO",
            "REFNUMHO",
            "LSACONHO",
            "ALTLCNHO",
            "LCNSEIHO",
            "ALCSEIHO"
        )
);


-- ---------------------------------------------------------------------------
-- 5. HO -> HG Part Application relationship
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
    active,
    comments
)
VALUES
(
    'HO',
    'HG',
    'fk_ho__hg',
    'foreign_key',
    'Part Application',
    '[
        "EIACODXA",
        "ALTLCNHO",
        "LSACONHO",
        "LCNTYPXB",
        "CAGECDHO",
        "REFNUMHO"
    ]'::jsonb,
    '[
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB",
        "CAGECDXH",
        "REFNUMHA"
    ]'::jsonb,
    TRUE,
    'HO applies an XC System/End Item UOC to an existing HG Part Application.'
);


-- ---------------------------------------------------------------------------
-- 6. HO -> XC System/End Item UOC relationship
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
    active,
    comments
)
VALUES
(
    'HO',
    'XC',
    'fk_ho__xc',
    'foreign_key',
    'System/End Item UOC',
    '[
        "EIACODXA",
        "ALCSEIHO",
        "LCNSEIHO",
        "LCNTYPXB"
    ]'::jsonb,
    '[
        "EIACODXA",
        "ALTLCNXB",
        "LSACONXB",
        "LCNTYPXB"
    ]'::jsonb,
    TRUE,
    'HO references the XC System/End Item record from which UOC and PCCN are obtained.'
);


-- ---------------------------------------------------------------------------
-- 7. Final guards
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.field_def
        WHERE entity_code = 'HO'
          AND include_element
          AND NOT deprecated
    ) <> 8 THEN
        RAISE EXCEPTION 'HO must contain exactly eight included baseline fields';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM lsar_meta.field_def
        WHERE entity_code = 'HO'
          AND is_key
          AND is_foreign
          AND is_mandatory
    ) <> 8 THEN
        RAISE EXCEPTION 'All eight HO fields must be mandatory foreign-key key components';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND active
          AND parent_entity_code IN ('HG','XC')
    ) <> 2 THEN
        RAISE EXCEPTION 'HO must have exactly two active HG/XC parent relationships';
    END IF;
END $$;

COMMIT;
