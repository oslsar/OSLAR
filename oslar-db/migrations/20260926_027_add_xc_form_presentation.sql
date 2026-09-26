BEGIN;

-- ============================================================================
-- XC generated form presentation.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. XC entity behavior
-- ---------------------------------------------------------------------------

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
    'XC',
    'System End Item',
    50,
    TRUE,
    'default-edit',
    'LSACONXB',
    'asc',
    25,
    '["ITMDESXC", "LSACONXB"]'::jsonb,
    '["EIACODXA", "LSACONXB", "ITMDESXC", "PCCNUMXC", "UOCSEIXC"]'::jsonb,
    '["LSACONXB", "ITMDESXC", "PCCNUMXC", "UOCSEIXC"]'::jsonb,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    TRUE
)
ON CONFLICT (entity_code)
DO UPDATE SET
    navigation_label       = EXCLUDED.navigation_label,
    navigation_order       = EXCLUDED.navigation_order,
    show_in_navigation     = EXCLUDED.show_in_navigation,
    default_form_code      = EXCLUDED.default_form_code,
    default_sort_column    = EXCLUDED.default_sort_column,
    default_sort_direction = EXCLUDED.default_sort_direction,
    default_page_size      = EXCLUDED.default_page_size,
    lookup_display_columns = EXCLUDED.lookup_display_columns,
    default_list_columns   = EXCLUDED.default_list_columns,
    default_search_columns = EXCLUDED.default_search_columns,
    allow_create           = EXCLUDED.allow_create,
    allow_edit             = EXCLUDED.allow_edit,
    allow_delete           = EXCLUDED.allow_delete,
    allow_import           = EXCLUDED.allow_import,
    allow_export           = EXCLUDED.allow_export,
    active                 = EXCLUDED.active,
    updated_at             = now();


-- ---------------------------------------------------------------------------
-- 2. XC form definition
-- ---------------------------------------------------------------------------

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
    'XC',
    'default-edit',
    'XC Default Edit Form',
    'edit',
    'Metadata-driven System End Item form.',
    TRUE
)
ON CONFLICT (entity_code, form_code)
DO UPDATE SET
    form_name   = EXCLUDED.form_name,
    form_type   = EXCLUDED.form_type,
    description = EXCLUDED.description,
    active      = TRUE,
    updated_at  = now();


-- ---------------------------------------------------------------------------
-- 3. XC form sections
-- ---------------------------------------------------------------------------

WITH xc_form AS
(
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'XC'
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
    xc_form.form_definition_id,
    x.section_code,
    x.section_name,
    x.description,
    x.display_order,
    x.column_count,
    x.collapsible,
    x.initially_collapsed,
    TRUE
FROM xc_form
CROSS JOIN
(
    VALUES
        (
            'parent-lcn',
            'Parent LCN',
            'Parent XB System/End Item LCN and inherited composite key values.',
            10,
            2,
            FALSE,
            FALSE
        ),
        (
            'system-end-item',
            'System / End Item',
            'System End Item identification and applicability information.',
            20,
            2,
            FALSE,
            FALSE
        ),
        (
            'provisioning',
            'Provisioning',
            'System End Item provisioning quantities and control information.',
            30,
            2,
            FALSE,
            FALSE
        )
) AS x
(
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed
)
ON CONFLICT (form_definition_id, section_code)
DO UPDATE SET
    section_name        = EXCLUDED.section_name,
    description         = EXCLUDED.description,
    display_order       = EXCLUDED.display_order,
    column_count        = EXCLUDED.column_count,
    collapsible         = EXCLUDED.collapsible,
    initially_collapsed = EXCLUDED.initially_collapsed,
    active              = TRUE,
    updated_at          = now();


-- ---------------------------------------------------------------------------
-- 4. XC field behavior
-- ---------------------------------------------------------------------------

WITH xc_sections AS
(
    SELECT
        fs.form_section_id,
        fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'XC'
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
    x.display_label,
    x.display_order,
    x.control_type,
    x.required,
    x.read_only,
    FALSE,
    x.searchable,
    x.sortable,
    x.filterable,
    x.placeholder,
    x.help_text,
    x.default_width,
    xs.form_section_id,
    x.column_span,
    TRUE
FROM
(
    VALUES

        -- Parent LCN
        ('EIACODXA', 'Parent LCN', 10, 'lookup',
         TRUE, FALSE, TRUE, TRUE, TRUE,
         'Select parent LCN',
         'Select a parent XB System or End Item LCN. The complete composite key is supplied by the selection.',
         30, 'parent-lcn', 2),

        ('ALTLCNXB', 'ALC', 20, 'text',
         TRUE, TRUE, TRUE, TRUE, TRUE,
         NULL, 'Supplied by Parent LCN selection.',
         10, 'parent-lcn', 1),

        ('LSACONXB', 'LCN', 30, 'text',
         TRUE, TRUE, TRUE, TRUE, TRUE,
         NULL, 'Supplied by Parent LCN selection.',
         24, 'parent-lcn', 1),

        ('LCNTYPXB', 'LCN Type', 40, 'text',
         TRUE, TRUE, TRUE, TRUE, TRUE,
         NULL, 'Supplied by Parent LCN selection.',
         10, 'parent-lcn', 1),

        -- System / End Item
        ('ITMDESXC', 'System End Item Designator', 10, 'text',
         FALSE, FALSE, TRUE, TRUE, TRUE,
         NULL, NULL,
         36, 'system-end-item', 1),

        ('UOCSEIXC', 'Usable On Code', 20, 'text',
         TRUE, FALSE, TRUE, TRUE, TRUE,
         NULL, NULL,
         12, 'system-end-item', 1),

        ('TRASEIXC', 'Transportation End Item', 30, 'boolean',
         FALSE, FALSE, FALSE, TRUE, TRUE,
         NULL, NULL,
         18, 'system-end-item', 1),

        -- Provisioning
        ('QPEICOXC', 'Qty per End Item Calculation Option', 10, 'number',
         FALSE, FALSE, FALSE, TRUE, TRUE,
         NULL, NULL,
         16, 'provisioning', 1),

        ('PCCNUMXC', 'Provisioning Contract Control Number', 20, 'text',
         TRUE, FALSE, TRUE, TRUE, TRUE,
         NULL, NULL,
         18, 'provisioning', 1),

        ('PLISNOXC', 'Provisioning List Item Sequence Number', 30, 'text',
         FALSE, FALSE, TRUE, TRUE, TRUE,
         NULL, NULL,
         18, 'provisioning', 1),

        ('QTYASYXC', 'Quantity per Assembly', 40, 'text',
         FALSE, FALSE, FALSE, TRUE, TRUE,
         NULL, NULL,
         16, 'provisioning', 1),

        ('QTYPEIXC', 'Quantity per End Item', 50, 'text',
         FALSE, FALSE, FALSE, TRUE, TRUE,
         NULL, NULL,
         16, 'provisioning', 1),

        ('TOCCODXC', 'Type of Change Code', 60, 'text',
         FALSE, FALSE, FALSE, TRUE, TRUE,
         NULL, NULL,
         14, 'provisioning', 1)

) AS x
(
    column_name,
    display_label,
    display_order,
    control_type,
    required,
    read_only,
    searchable,
    sortable,
    filterable,
    placeholder,
    help_text,
    default_width,
    section_code,
    column_span
)
JOIN lsar_meta.field_def fd
  ON fd.entity_code = 'XC'
 AND fd.column_name = x.column_name
 AND fd.deprecated = FALSE
JOIN xc_sections xs
  ON xs.section_code = x.section_code
ON CONFLICT (field_def_id)
DO UPDATE SET
    display_label   = EXCLUDED.display_label,
    display_order   = EXCLUDED.display_order,
    control_type    = EXCLUDED.control_type,
    required        = EXCLUDED.required,
    read_only       = EXCLUDED.read_only,
    hidden          = EXCLUDED.hidden,
    searchable      = EXCLUDED.searchable,
    sortable        = EXCLUDED.sortable,
    filterable      = EXCLUDED.filterable,
    placeholder     = EXCLUDED.placeholder,
    help_text       = EXCLUDED.help_text,
    default_width   = EXCLUDED.default_width,
    form_section_id = EXCLUDED.form_section_id,
    column_span     = EXCLUDED.column_span,
    active          = TRUE,
    updated_at      = now();

COMMIT;
