BEGIN;

-- HG (Parts Application): metadata-driven form only.
-- Deliberately keep CRUD and navigation disabled until UI and parent-key tests pass.
-- Field labels default to baseline element_name; no physical LSAR columns are altered.
-- Migration assumes HG currently has no form/field/entity behavior rows.

DO $$
BEGIN
    IF (SELECT count(*) FROM lsar_meta.field_def
        WHERE entity_code = 'HG' AND include_element AND NOT deprecated) <> 70 THEN
        RAISE EXCEPTION 'Expected exactly 70 included HG fields; no changes applied';
    END IF;

    IF EXISTS (SELECT 1 FROM lsar_meta.entity_behavior WHERE entity_code = 'HG')
       OR EXISTS (SELECT 1 FROM lsar_meta.form_definition WHERE entity_code = 'HG')
       OR EXISTS (
           SELECT 1 FROM lsar_meta.field_behavior fb
           JOIN lsar_meta.field_def fd USING (field_def_id)
           WHERE fd.entity_code = 'HG'
       ) THEN
        RAISE EXCEPTION 'Existing HG presentation metadata found; review before applying 035';
    END IF;

    IF (SELECT count(*) FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HG' AND active AND (
            (parent_entity_code = 'XB' AND lookup_anchor_column = 'EIACODXA')
            OR (parent_entity_code = 'HA' AND lookup_anchor_column = 'CAGECDXH'
                AND lookup_filter->>'operator' = 'eq_context'
                AND lookup_filter->>'column' = 'EIACODXA'
                AND lookup_filter->>'sourceColumn' = 'EIACODXA')
        )) <> 2 THEN
        RAISE EXCEPTION 'HG lookup anchors/context filter must be configured before 035';
    END IF;
END $$;

INSERT INTO lsar_meta.entity_behavior
(
    entity_code, navigation_label, navigation_order, show_in_navigation,
    default_form_code, default_sort_column, default_sort_direction,
    default_page_size, lookup_display_columns, default_list_columns,
    default_search_columns, allow_create, allow_edit, allow_delete,
    allow_import, allow_export, active
)
VALUES
(
    'HG', 'Parts Application', 80, FALSE,
    'default-edit', 'LSACONXB', 'asc', 25,
    '["LSACONXB", "REFNUMHA", "CAGECDXH"]'::jsonb,
    '["EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB", "CAGECDXH", "REFNUMHA", "QTYASYHG", "QTYPEIHG"]'::jsonb,
    '["LSACONXB", "REFNUMHA", "CAGECDXH", "EIACODXA"]'::jsonb,
    FALSE, FALSE, FALSE, FALSE, FALSE, TRUE
);

INSERT INTO lsar_meta.form_definition
(entity_code, form_code, form_name, form_type, description, active)
VALUES
('HG', 'default-edit', 'HG Parts Application', 'edit',
 'Metadata-driven HG application of a part to an XB LCN, constrained to a common End Item.', TRUE);

WITH hg_form AS (
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'HG' AND form_code = 'default-edit'
)
INSERT INTO lsar_meta.form_section
(form_definition_id, section_code, section_name, description,
 display_order, column_count, collapsible, initially_collapsed, active)
SELECT f.form_definition_id, x.section_code, x.section_name, x.description,
       x.display_order, x.column_count, x.collapsible, x.initially_collapsed, TRUE
FROM hg_form f
CROSS JOIN (VALUES
    ('parent-lcn', 'Parent LCN', 'Select the XB position/LCN. Supplies the shared End Item and XB composite key.', 10, 2, FALSE, FALSE),
    ('applied-part', 'Applied Part', 'Select the HA part within the End Item established by Parent LCN.', 20, 2, FALSE, FALSE),
    ('quantities-stock', 'Quantities and Stock', 'Allowance, quantity and recommended stock information.', 30, 2, FALSE, FALSE),
    ('provisioning', 'Provisioning', 'Provisioning list references, identifier and remarks.', 40, 2, TRUE, FALSE),
    ('maintenance-rates', 'Maintenance Rates and Actions', 'Maintenance rates, codes, repairability and survival information.', 50, 2, TRUE, FALSE),
    ('maintenance-distribution', 'Maintenance Distribution and Cycle Times', 'Task distributions and repair/replacement cycle times by maintenance level.', 60, 2, TRUE, TRUE),
    ('documentation', 'Provisioning Technical Documentation', 'Applicability flags for provisioning technical documentation lists.', 70, 2, TRUE, TRUE),
    ('identification-codes', 'Identification and Codes', 'Item identification, classification and other status indicators.', 80, 2, TRUE, TRUE)
) AS x(section_code, section_name, description,
       display_order, column_count, collapsible, initially_collapsed);

-- Every included HG field is assigned exactly one section.
-- Two anchors render lookup widgets; companion key fields stay derived/read-only.
-- Other control types are inferred by the existing compiler from format_spec.
-- DRPTWOHG retains its UNKNOWN format metadata (physical type is text).
WITH field_sections(column_name, section_code) AS (
    VALUES
    ('EIACODXA', 'parent-lcn'),
    ('ALTLCNXB', 'parent-lcn'),
    ('LSACONXB', 'parent-lcn'),
    ('LCNTYPXB', 'parent-lcn'),
    ('CAGECDXH', 'applied-part'),
    ('REFNUMHA', 'applied-part'),
    ('ALLOWCHG', 'quantities-stock'),
    ('ALIQTYHG', 'quantities-stock'),
    ('QTYASYHG', 'quantities-stock'),
    ('QTYPEIHG', 'quantities-stock'),
    ('MINREUHG', 'quantities-stock'),
    ('RISSBUHG', 'quantities-stock'),
    ('RMSSLIHG', 'quantities-stock'),
    ('RTLLQTHG', 'quantities-stock'),
    ('TOTQTYHG', 'quantities-stock'),
    ('PIPLISHG', 'provisioning'),
    ('PLISNOHG', 'provisioning'),
    ('PREMARHG', 'provisioning'),
    ('PROSICHG', 'provisioning'),
    ('SAPLISHG', 'provisioning'),
    ('MAIACTHG', 'maintenance-rates'),
    ('MRRONEHG', 'maintenance-rates'),
    ('MRRTWOHG', 'maintenance-rates'),
    ('MRRMODHG', 'maintenance-rates'),
    ('MAOTIMHG', 'maintenance-rates'),
    ('NORETSHG', 'maintenance-rates'),
    ('REPSURHG', 'maintenance-rates'),
    ('CADMTDHG', 'maintenance-distribution'),
    ('CBDMTDHG', 'maintenance-distribution'),
    ('CONRCTHG', 'maintenance-distribution'),
    ('DMTDDDHG', 'maintenance-distribution'),
    ('DRCTDDHG', 'maintenance-distribution'),
    ('DRTDDDHG', 'maintenance-distribution'),
    ('FMTDFFHG', 'maintenance-distribution'),
    ('FRCTFFHG', 'maintenance-distribution'),
    ('FRTDFFHG', 'maintenance-distribution'),
    ('HMTDHHHG', 'maintenance-distribution'),
    ('HRCTHHHG', 'maintenance-distribution'),
    ('HRTDHHHG', 'maintenance-distribution'),
    ('OMTDOOHG', 'maintenance-distribution'),
    ('ORCTOOHG', 'maintenance-distribution'),
    ('ORTDOOHG', 'maintenance-distribution'),
    ('LMTDLLHG', 'maintenance-distribution'),
    ('LRCTLLHG', 'maintenance-distribution'),
    ('LRTDLLHG', 'maintenance-distribution'),
    ('ARAPTDHG', 'documentation'),
    ('ARBPTDHG', 'documentation'),
    ('CBLPTDHG', 'documentation'),
    ('ISLPTDHG', 'documentation'),
    ('LLIPTDHG', 'documentation'),
    ('PCLPTDHG', 'documentation'),
    ('PPLPTDHG', 'documentation'),
    ('RILPTDHG', 'documentation'),
    ('SFPPTDHG', 'documentation'),
    ('SCPPTDHG', 'documentation'),
    ('TTLPTDHG', 'documentation'),
    ('DATASCHG', 'identification-codes'),
    ('DRPONEHG', 'identification-codes'),
    ('DRPTWOHG', 'identification-codes'),
    ('ESSCODHG', 'identification-codes'),
    ('HARDCIHG', 'identification-codes'),
    ('IDENTNHG', 'identification-codes'),
    ('INDCODHG', 'identification-codes'),
    ('ITMCATHG', 'identification-codes'),
    ('LRUNITHG', 'identification-codes'),
    ('REMIPIHG', 'identification-codes'),
    ('SMRCODHG', 'identification-codes'),
    ('SUPINDHG', 'identification-codes'),
    ('TOCCODHG', 'identification-codes'),
    ('WRKUCDHG', 'identification-codes')
), hg_sections AS (
    SELECT fs.form_section_id, fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'HG' AND f.form_code = 'default-edit'
)
INSERT INTO lsar_meta.field_behavior
(field_def_id, display_label, display_order, control_type,
 required, read_only, hidden, searchable, sortable, filterable,
 placeholder, help_text, default_width, form_section_id, column_span, active)
SELECT fd.field_def_id,
       CASE fd.column_name
           WHEN 'EIACODXA' THEN 'Parent LCN'
           WHEN 'CAGECDXH' THEN 'Applied Part'
           WHEN 'REFNUMHA' THEN 'Part / Reference Number'
           WHEN 'QTYASYHG' THEN 'Quantity per Assembly'
           WHEN 'QTYPEIHG' THEN 'Quantity per End Item'
           ELSE COALESCE(NULLIF(btrim(fd.element_name), ''), fd.column_name)
       END,
       fd.ordinal_pos,
       CASE fd.column_name
           WHEN 'EIACODXA' THEN 'lookup'
           WHEN 'CAGECDXH' THEN 'lookup'
           WHEN 'PREMARHG' THEN 'textarea'
           WHEN 'DRPTWOHG' THEN 'text'
           ELSE NULL
       END,
       fd.is_mandatory OR fd.is_key,
       CASE WHEN fd.is_key THEN NULL::boolean ELSE FALSE END,
       FALSE,
       (fd.is_key OR fd.column_name IN ('QTYASYHG', 'QTYPEIHG')),
       TRUE, TRUE,
       CASE fd.column_name
           WHEN 'EIACODXA' THEN 'Select parent LCN'
           WHEN 'CAGECDXH' THEN 'Select applied part from the same End Item'
           ELSE NULL
       END,
       CASE fd.column_name
           WHEN 'EIACODXA' THEN 'Select an XB Parent LCN; automatically fills its four key fields.'
           WHEN 'CAGECDXH' THEN 'Select an HA Applied Part matching the End Item chosen in Parent LCN.'
           WHEN 'ALTLCNXB' THEN 'Automatically populated from Parent LCN selection.'
           WHEN 'LSACONXB' THEN 'Automatically populated from Parent LCN selection.'
           WHEN 'LCNTYPXB' THEN 'Automatically populated from Parent LCN selection.'
           WHEN 'REFNUMHA' THEN 'Automatically populated from Applied Part selection.'
           WHEN 'DRPTWOHG' THEN 'Baseline format is UNKNOWN; preserved as text pending standards review.'
           ELSE NULL
       END,
       CASE fd.column_name
           WHEN 'EIACODXA' THEN 30
           WHEN 'CAGECDXH' THEN 30
           WHEN 'REFNUMHA' THEN 32
           WHEN 'PREMARHG' THEN 50
           ELSE 20
       END,
       hs.form_section_id,
       CASE WHEN fd.column_name = 'PREMARHG' THEN 2 ELSE 1 END,
       TRUE
FROM field_sections x
JOIN lsar_meta.field_def fd
  ON fd.entity_code = 'HG'
 AND fd.column_name = x.column_name
 AND fd.include_element = TRUE AND fd.deprecated = FALSE
JOIN hg_sections hs ON hs.section_code = x.section_code;

-- Fail and roll back atomically if any of the 70 fields failed to get a section.
DO $$
DECLARE assigned integer;
BEGIN
    SELECT count(*) INTO assigned
    FROM lsar_meta.field_behavior fb
    JOIN lsar_meta.field_def fd USING (field_def_id)
    WHERE fd.entity_code = 'HG'
      AND fd.include_element AND NOT fd.deprecated
      AND fb.form_section_id IS NOT NULL
      AND fb.active;

    IF assigned <> 70 THEN
        RAISE EXCEPTION 'HG form has % assigned fields; expected 70', assigned;
    END IF;
END $$;

COMMIT;
