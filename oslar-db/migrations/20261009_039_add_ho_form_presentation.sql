BEGIN;

-- HO: provisioning System/End Item Usable-On Code.
-- Create presentation metadata only.
-- Navigation and CRUD remain disabled until browser/lookup tests pass.

DO $$
BEGIN
    IF (
        SELECT count(*)
        FROM lsar_meta.field_def
        WHERE entity_code = 'HO'
          AND include_element
          AND NOT deprecated
    ) <> 8 THEN
        RAISE EXCEPTION 'Expected exactly 8 included HO fields; no changes applied';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HO'
    )
    OR EXISTS (
        SELECT 1
        FROM lsar_meta.form_definition
        WHERE entity_code = 'HO'
    )
    OR EXISTS (
        SELECT 1
        FROM lsar_meta.field_behavior fb
        JOIN lsar_meta.field_def fd USING (field_def_id)
        WHERE fd.entity_code = 'HO'
    ) THEN
        RAISE EXCEPTION 'Existing HO presentation metadata found; review before applying 039';
    END IF;

    IF (
        SELECT count(*)
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND active
          AND parent_entity_code IN ('HG', 'XC')
    ) <> 2 THEN
        RAISE EXCEPTION 'Expected active HO relationships to HG and XC';
    END IF;

    IF (
        SELECT count(*)
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND parent_entity_code = 'XC'
          AND active
          AND lookup_filter =
              '{
                 "operator":"eq_contexts",
                 "filters":[
                   {"column":"EIACODXA","sourceColumn":"EIACODXA"},
                   {"column":"LCNTYPXB","sourceColumn":"LCNTYPXB"}
                 ]
               }'::jsonb
    ) <> 1 THEN
        RAISE EXCEPTION 'HO -> XC multi-context lookup filter must be configured before 039';
    END IF;
END $$;

INSERT INTO lsar_meta.entity_behavior
(
    entity_code,
    navigation_label,
    navigation_order,
    show_in_navigation,
    default_form_code,
    default_sort_column,
    default_sort_direction,
    default_page_size,
    lookup_display_columns,
    default_list_columns,
    default_search_columns,
    allow_create,
    allow_edit,
    allow_delete,
    allow_import,
    allow_export,
    active
)
VALUES
(
    'HO',
    'Provisioning UOC',
    90,
    FALSE,
    'default-edit',
    'LSACONHO',
    'asc',
    25,
    '["LSACONHO","REFNUMHO","LCNSEIHO"]'::jsonb,
    '["EIACODXA","ALTLCNHO","LSACONHO","LCNTYPXB","CAGECDHO","REFNUMHO","ALCSEIHO","LCNSEIHO"]'::jsonb,
    '["EIACODXA","LSACONHO","REFNUMHO","LCNSEIHO"]'::jsonb,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    TRUE
);

INSERT INTO lsar_meta.form_definition
(
    entity_code,
    form_code,
    form_name,
    form_type,
    description,
    active
)
VALUES
(
    'HO',
    'default-edit',
    'HO Provisioning System/End Item UOC',
    'edit',
    'Metadata-driven HO relationship between an HG Part Application and an XC System/End Item Usable-On Code.',
    TRUE
);

WITH ho_form AS (
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'HO'
      AND form_code = 'default-edit'
)
INSERT INTO lsar_meta.form_section
(
    form_definition_id,
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed,
    active
)
SELECT
    f.form_definition_id,
    x.section_code,
    x.section_name,
    x.description,
    x.display_order,
    x.column_count,
    x.collapsible,
    x.initially_collapsed,
    TRUE
FROM ho_form f
CROSS JOIN (
    VALUES
    (
        'part-application',
        'Part Application',
        'Select the HG Part Application. Supplies the End Item, LCN, LCN Type, CAGE and Reference Number.',
        10, 2, FALSE, FALSE
    ),
    (
        'system-ei-uoc',
        'System/End Item UOC',
        'Select the XC System/End Item Usable-On Code constrained to the End Item and LCN Type supplied by Part Application.',
        20, 2, FALSE, FALSE
    )
) AS x(
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed
);

WITH field_sections(column_name, section_code) AS (
    VALUES
        ('EIACODXA', 'part-application'),
        ('ALTLCNHO', 'part-application'),
        ('LSACONHO', 'part-application'),
        ('LCNTYPXB', 'part-application'),
        ('CAGECDHO', 'part-application'),
        ('REFNUMHO', 'part-application'),
        ('ALCSEIHO', 'system-ei-uoc'),
        ('LCNSEIHO', 'system-ei-uoc')
),
ho_sections AS (
    SELECT
        fs.form_section_id,
        fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'HO'
      AND f.form_code = 'default-edit'
)
INSERT INTO lsar_meta.field_behavior
(
    field_def_id,
    display_label,
    display_order,
    control_type,
    required,
    read_only,
    hidden,
    searchable,
    sortable,
    filterable,
    placeholder,
    help_text,
    default_width,
    form_section_id,
    column_span,
    active
)
SELECT
    fd.field_def_id,

    CASE fd.column_name
        WHEN 'EIACODXA' THEN 'Part Application'
        WHEN 'ALTLCNHO' THEN 'Part Application ALC'
        WHEN 'LSACONHO' THEN 'Part Application LCN'
        WHEN 'LCNTYPXB' THEN 'LCN Type'
        WHEN 'CAGECDHO' THEN 'Part CAGE Code'
        WHEN 'REFNUMHO' THEN 'Part / Reference Number'
        WHEN 'ALCSEIHO' THEN 'System/End Item UOC'
        WHEN 'LCNSEIHO' THEN 'System/End Item UOC LCN'
        ELSE COALESCE(NULLIF(btrim(fd.element_name), ''), fd.column_name)
    END,

    fd.ordinal_pos,

    CASE fd.column_name
        WHEN 'EIACODXA' THEN 'lookup'
        WHEN 'ALCSEIHO' THEN 'lookup'
        ELSE NULL
    END,

    TRUE,

    CASE
        WHEN fd.is_key THEN NULL::boolean
        ELSE FALSE
    END,

    FALSE,
    TRUE,
    TRUE,
    TRUE,

    CASE fd.column_name
        WHEN 'EIACODXA' THEN 'Select Part Application'
        WHEN 'ALCSEIHO' THEN 'Select System/End Item UOC'
        ELSE NULL
    END,

    CASE fd.column_name
        WHEN 'EIACODXA'
            THEN 'Select an HG Part Application; automatically fills its six HO relationship fields.'
        WHEN 'ALTLCNHO'
            THEN 'Automatically populated from Part Application.'
        WHEN 'LSACONHO'
            THEN 'Automatically populated from Part Application.'
        WHEN 'LCNTYPXB'
            THEN 'Automatically populated from Part Application and used to filter System/End Item UOC.'
        WHEN 'CAGECDHO'
            THEN 'Automatically populated from Part Application.'
        WHEN 'REFNUMHO'
            THEN 'Automatically populated from Part Application.'
        WHEN 'ALCSEIHO'
            THEN 'Select an XC System/End Item UOC matching the selected End Item and LCN Type.'
        WHEN 'LCNSEIHO'
            THEN 'Automatically populated from System/End Item UOC.'
        ELSE NULL
    END,

    CASE fd.column_name
        WHEN 'EIACODXA' THEN 30
        WHEN 'ALCSEIHO' THEN 30
        WHEN 'REFNUMHO' THEN 32
        ELSE 20
    END,

    hs.form_section_id,
    1,
    TRUE

FROM field_sections x
JOIN lsar_meta.field_def fd
  ON fd.entity_code = 'HO'
 AND fd.column_name = x.column_name
 AND fd.include_element = TRUE
 AND fd.deprecated = FALSE
JOIN ho_sections hs
  ON hs.section_code = x.section_code;

DO $$
DECLARE
    assigned integer;
BEGIN
    SELECT count(*)
    INTO assigned
    FROM lsar_meta.field_behavior fb
    JOIN lsar_meta.field_def fd USING (field_def_id)
    WHERE fd.entity_code = 'HO'
      AND fd.include_element
      AND NOT fd.deprecated
      AND fb.form_section_id IS NOT NULL
      AND fb.active;

    IF assigned <> 8 THEN
        RAISE EXCEPTION
            'HO form has % assigned fields; expected 8',
            assigned;
    END IF;
END $$;

COMMIT;
