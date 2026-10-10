BEGIN;

-- ============================================================================
-- Add missing BASELINE XH entity.
--
-- XH = Commercial and Government Entity data.
--
-- Primary key:
--   CAGECDXH
--
--
-- The supplied XH baseline identifies is_key and is_foreign but does not
-- explicitly provide is_mandatory, include_element, mandatory_override, or
-- deprecated values. Current BASELINE defaults are therefore used:
--   is_mandatory       = FALSE
--   include_element    = TRUE
--   mandatory_override = FALSE
--   deprecated         = FALSE
--
-- This migration adds XH to:
--   1. dbinfo_raw baseline source metadata
--   2. compiler entity metadata
--   3. compiler field metadata
--   4. physical lsar_core schema
--
-- lsar_meta.dbinfo is intentionally not populated. The current baseline uses
-- dbinfo_raw, exposed through v_dbinfo.
-- ============================================================================


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
SELECT
    v.tag,
    v.profile_code,
    v.entity_code,
    v.field,
    v.geia_short_name,
    v.element_name,
    v.format_spec,
    v.ded,
    v.giea,
    v.mil_1388_field,
    v.def_std_00_60,
    v.s3000l,
    v.ordinal_pos,
    v.key,
    v.is_key,
    v.is_foreign,
    v.is_mandatory,
    v.originates_in_entity,
    v.include_element,
    v.mandatory_override,
    v.deprecated,
    NULL,
    NULL
FROM
(
    VALUES
        (
            'P1', 'BASELINE', 'XH',
            'CAGECDXH', 'cage',
            'Commercial and Government Entity Code',
            'string(5)', '046', '1520',
            'ADCAGEHB', 'CAGECDXH', 'CAGECDXH',
            '1', 'K',
            'TRUE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CACITYXH', 'cagecity',
            'Commercial and Government Entity City',
            'string(20)', '047', '1510',
            'CACITYXH', 'CACITYXH', 'CACITYXH',
            '2', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CANAMEXH', 'cagename',
            'Commercial and Government Entity Name',
            'string(25)', '047', '1530',
            'CACITYXH', 'CANAMEXH', 'CANAMEXH',
            '3', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CANATNXH', 'cagenatn',
            'Commercial and Government Entity Nation',
            'string(20)', '047', '1540',
            'CACITYXH', 'CANATNXH', 'CANATNXH',
            '4', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CAPOZOXH', 'cagepost',
            'Commercial and Government Entity Postal Zone',
            'string(10)', '047', '1550',
            'CACITYXH', 'CAPOZOXH', 'CAPOZOXH',
            '5', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CASTATXH', 'cagestat',
            'Commercial and Government Entity State',
            'string(2)', '047', '1560',
            'CACITYXH', 'CASTATXH', 'CASTATXH',
            '6', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        ),
        (
            'P1', 'BASELINE', 'XH',
            'CASTREXH', 'cagestrt',
            'Commercial and Government Entity Street',
            'string(25)', '047', '1570',
            'CACITYXH', 'CASTREXH', 'CASTREXH',
            '7', '0',
            'FALSE', 'FALSE', 'FALSE', '0',
            'TRUE', 'FALSE', 'FALSE'
        )
) AS v
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
    deprecated
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM lsar_meta.dbinfo_raw r
    WHERE r.profile_code = v.profile_code
      AND r.entity_code = v.entity_code
      AND r.field = v.field
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
    'XH',
    'Table XH',
    'P1',
    'BASELINE',
    TRUE,
    'Commercial and Government Entity data.'
)
ON CONFLICT (entity_code)
DO UPDATE SET
    entity_name    = EXCLUDED.entity_name,
    source_tag     = EXCLUDED.source_tag,
    profile_code   = EXCLUDED.profile_code,
    include_entity = TRUE,
    comments       = EXCLUDED.comments;


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
    (
        'XH', 'CAGECDXH', 1, 'string(5)', '046',
        'cage', 'Commercial and Government Entity Code',
        'ADCAGEHB', 'CAGECDXH', 'CAGECDXH',
        'K', TRUE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CACITYXH', 2, 'string(20)', '047',
        'cagecity', 'Commercial and Government Entity City',
        'CACITYXH', 'CACITYXH', 'CACITYXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CANAMEXH', 3, 'string(25)', '047',
        'cagename', 'Commercial and Government Entity Name',
        'CACITYXH', 'CANAMEXH', 'CANAMEXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CANATNXH', 4, 'string(20)', '047',
        'cagenatn', 'Commercial and Government Entity Nation',
        'CACITYXH', 'CANATNXH', 'CANATNXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CAPOZOXH', 5, 'string(10)', '047',
        'cagepost', 'Commercial and Government Entity Postal Zone',
        'CACITYXH', 'CAPOZOXH', 'CAPOZOXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CASTATXH', 6, 'string(2)', '047',
        'cagestat', 'Commercial and Government Entity State',
        'CACITYXH', 'CASTATXH', 'CASTATXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    ),
    (
        'XH', 'CASTREXH', 7, 'string(25)', '047',
        'cagestrt', 'Commercial and Government Entity Street',
        'CACITYXH', 'CASTREXH', 'CASTREXH',
        '0', FALSE, FALSE, FALSE, '0',
        TRUE, 'FALSE', FALSE
    )
ON CONFLICT (entity_code, column_name)
DO UPDATE SET
    ordinal_pos          = EXCLUDED.ordinal_pos,
    format_spec          = EXCLUDED.format_spec,
    ded                  = EXCLUDED.ded,
    geia_short_name      = EXCLUDED.geia_short_name,
    element_name         = EXCLUDED.element_name,
    mil_1388_field       = EXCLUDED.mil_1388_field,
    def_std_00_60        = EXCLUDED.def_std_00_60,
    s3000l               = EXCLUDED.s3000l,
    key_class            = EXCLUDED.key_class,
    is_key               = EXCLUDED.is_key,
    is_foreign           = EXCLUDED.is_foreign,
    is_mandatory         = EXCLUDED.is_mandatory,
    originates_in_entity = EXCLUDED.originates_in_entity,
    include_element      = EXCLUDED.include_element,
    mandatory_override   = EXCLUDED.mandatory_override,
    deprecated           = EXCLUDED.deprecated;


-- ---------------------------------------------------------------------------
-- 4. Physical XH table
-- ---------------------------------------------------------------------------

CREATE TABLE lsar_core."XH"
(
    "CAGECDXH" varchar(5)  NOT NULL,
    "CACITYXH" varchar(20),
    "CANAMEXH" varchar(25),
    "CANATNXH" varchar(20),
    "CAPOZOXH" varchar(10),
    "CASTATXH" varchar(2),
    "CASTREXH" varchar(25),

    CONSTRAINT "XH_PK"
        PRIMARY KEY ("CAGECDXH")
);

COMMIT;
