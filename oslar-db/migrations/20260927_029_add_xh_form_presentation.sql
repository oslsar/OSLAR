BEGIN;

-- ============================================================================
-- XH generated form presentation.
--
-- XH = Commercial and Government Entity data.
-- Used as the CAGE / organization source for entities such as HA.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. XH entity behavior
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
    'XH',
    'CAGE / Organizations',
    60,
    TRUE,
    'default-edit',
    'CAGECDXH',
    'asc',
    25,
    '["CANAMEXH", "CAGECDXH"]'::jsonb,
    '["CAGECDXH", "CANAMEXH", "CACITYXH", "CASTATXH", "CANATNXH"]'::jsonb,
    '["CAGECDXH", "CANAMEXH", "CACITYXH", "CANATNXH"]'::jsonb,
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
-- 2. XH form definition
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
    'XH',
    'default-edit',
    'XH Default Edit Form',
    'edit',
    'Metadata-driven Commercial and Government Entity form.',
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
-- 3. XH form sections
-- ---------------------------------------------------------------------------

WITH xh_form AS
(
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'XH'
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
    xh_form.form_definition_id,
    x.section_code,
    x.section_name,
    x.description,
    x.display_order,
    x.column_count,
    x.collapsible,
    x.initially_collapsed,
    TRUE
FROM xh_form
CROSS JOIN
(
    VALUES
        (
            'organization',
            'Organization',
            'CAGE code and organization name.',
            10,
            2,
            FALSE,
            FALSE
        ),
        (
            'address',
            'Address',
            'Commercial or Government Entity address information.',
            20,
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
-- 4. XH field behavior
-- ---------------------------------------------------------------------------

WITH xh_sections AS
(
    SELECT
        fs.form_section_id,
        fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'XH'
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
        -- Organization
        (
            'CAGECDXH',
            'CAGE Code',
            10,
            'text',
            TRUE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter CAGE code',
            'Commercial and Government Entity Code.',
            12,
            'organization',
            1
        ),
        (
            'CANAMEXH',
            'Organization Name',
            20,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter organization name',
            NULL,
            30,
            'organization',
            1
        ),

        -- Address
        (
            'CASTREXH',
            'Street',
            10,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter street address',
            NULL,
            30,
            'address',
            2
        ),
        (
            'CACITYXH',
            'City',
            20,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter city',
            NULL,
            20,
            'address',
            1
        ),
        (
            'CASTATXH',
            'State / Province',
            30,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter state or province',
            NULL,
            12,
            'address',
            1
        ),
        (
            'CAPOZOXH',
            'Postal / ZIP Code',
            40,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter postal or ZIP code',
            NULL,
            14,
            'address',
            1
        ),
        (
            'CANATNXH',
            'Nation',
            50,
            'text',
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            TRUE,
            'Enter nation',
            NULL,
            20,
            'address',
            1
        )
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
  ON fd.entity_code = 'XH'
 AND fd.column_name = x.column_name
 AND fd.deprecated = FALSE
JOIN xh_sections xs
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
