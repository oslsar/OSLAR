BEGIN;

-- ============================================================
-- XB generated form
-- ============================================================

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
    'XB',
    'default-edit',
    'XB Default Edit Form',
    'edit',
    'Metadata-driven LCN Structure form.',
    true
)
ON CONFLICT (entity_code, form_code)
DO UPDATE SET
    form_name = EXCLUDED.form_name,
    form_type = EXCLUDED.form_type,
    description = EXCLUDED.description,
    active = true,
    updated_at = now();


-- ============================================================
-- Form sections
-- ============================================================

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
    fd.form_definition_id,
    v.section_code,
    v.section_name,
    v.description,
    v.display_order,
    v.column_count,
    v.collapsible,
    v.initially_collapsed,
    true
FROM lsar_meta.form_definition fd
CROSS JOIN
(
    VALUES
        (
            'parent-end-item',
            'Parent End Item',
            'End Item containing this LCN.',
            10,
            2,
            false,
            false
        ),
        (
            'lcn-details',
            'LCN Details',
            'LCN identity, nomenclature and descriptive information.',
            20,
            2,
            false,
            false
        ),
        (
            'technical',
            'Indicators / Technical Data',
            'Technical, RAM, transportation and work area information.',
            30,
            2,
            true,
            false
        )
) AS v
(
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed
)
WHERE fd.entity_code = 'XB'
  AND fd.form_code = 'default-edit'
ON CONFLICT (form_definition_id, section_code)
DO UPDATE SET
    section_name = EXCLUDED.section_name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    column_count = EXCLUDED.column_count,
    collapsible = EXCLUDED.collapsible,
    initially_collapsed = EXCLUDED.initially_collapsed,
    active = true,
    updated_at = now();


-- ============================================================
-- XB field behavior
-- ============================================================

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
    active,
    form_section_id,
    column_span
)
SELECT
    fd.field_def_id,
    v.display_label,
    v.display_order,
    v.control_type,
    v.required,
    v.read_only,
    false,
    v.searchable,
    v.sortable,
    v.filterable,
    v.placeholder,
    v.help_text,
    v.default_width,
    true,
    fs.form_section_id,
    v.column_span
FROM lsar_meta.field_def fd
JOIN
(
    VALUES

        -- Parent End Item
        (
            'EIACODXA',
            'Parent End Item',
            10,
            'lookup',
            true,
            false,
            true,
            true,
            true,
            'Select parent end item',
            'Select the XA End Item containing this LCN.',
            30,
            'parent-end-item',
            2
        ),

        -- LCN Details
        (
            'LSACONXB',
            'LCN',
            20,
            'text',
            true,
            false,
            true,
            true,
            true,
            NULL,
            NULL,
            24,
            'lcn-details',
            1
        ),
        (
            'ALTLCNXB',
            'ALC',
            30,
            'text',
            true,
            false,
            true,
            true,
            true,
            NULL,
            NULL,
            10,
            'lcn-details',
            1
        ),
        (
            'LCNTYPXB',
            'LCN Type',
            40,
            'text',
            true,
            false,
            true,
            true,
            true,
            NULL,
            NULL,
            10,
            'lcn-details',
            1
        ),
        (
            'LCNAMEXB',
            'LCN Nomenclature',
            50,
            'text',
            false,
            false,
            true,
            true,
            true,
            NULL,
            NULL,
            42,
            'lcn-details',
            1
        ),
        (
            'LCNDESXB',
            'LCN Description',
            60,
            'textarea',
            false,
            false,
            true,
            false,
            false,
            NULL,
            NULL,
            80,
            'lcn-details',
            2
        ),
        (
            'LCNINDXB',
            'LCN Indenture Code',
            70,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            10,
            'lcn-details',
            1
        ),
        (
            'MAGRIDXB',
            'Maintenance Group Identifier',
            80,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            32,
            'lcn-details',
            1
        ),

        -- Indicators / Technical Data
        (
            'WIBBLEXB',
            'Document Code',
            90,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            16,
            'technical',
            1
        ),
        (
            'RAMINDXB',
            'RAM Indicator',
            100,
            'boolean',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            12,
            'technical',
            1
        ),
        (
            'SECITMXB',
            'Sectionalized Item Transportation',
            110,
            'boolean',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            18,
            'technical',
            1
        ),
        (
            'SYSIDNXB',
            'System End Item Identifier',
            120,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            12,
            'technical',
            1
        ),
        (
            'TMFGCDXB',
            'Technical Manual Functional Group Code',
            130,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            18,
            'technical',
            1
        ),
        (
            'LOCWAZXB',
            'Work Area Zone',
            140,
            'text',
            false,
            false,
            false,
            true,
            true,
            NULL,
            NULL,
            16,
            'technical',
            1
        )

) AS v
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
    ON fd.entity_code = 'XB'
   AND fd.column_name = v.column_name

JOIN lsar_meta.form_definition formdef
  ON formdef.entity_code = 'XB'
 AND formdef.form_code = 'default-edit'

JOIN lsar_meta.form_section fs
  ON fs.form_definition_id = formdef.form_definition_id
 AND fs.section_code = v.section_code

ON CONFLICT (field_def_id)
DO UPDATE SET
    display_label = EXCLUDED.display_label,
    display_order = EXCLUDED.display_order,
    control_type = EXCLUDED.control_type,
    required = EXCLUDED.required,
    read_only = EXCLUDED.read_only,
    hidden = EXCLUDED.hidden,
    searchable = EXCLUDED.searchable,
    sortable = EXCLUDED.sortable,
    filterable = EXCLUDED.filterable,
    placeholder = EXCLUDED.placeholder,
    help_text = EXCLUDED.help_text,
    default_width = EXCLUDED.default_width,
    active = true,
    form_section_id = EXCLUDED.form_section_id,
    column_span = EXCLUDED.column_span,
    updated_at = now();


-- ============================================================
-- Enable compiler CRUD for XB
-- Delete remains deliberately disabled.
-- ============================================================

UPDATE lsar_meta.entity_behavior
SET
    default_form_code = 'default-edit',
    allow_create = true,
    allow_edit = true,
    allow_delete = false,
    updated_at = now()
WHERE entity_code = 'XB';


-- ============================================================
-- Human-readable parent relationship label
-- ============================================================

UPDATE lsar_meta.entity_relationship
SET relationship_label = 'Parent End Item'
WHERE child_entity_code = 'XB'
  AND parent_entity_code = 'XA'
  AND relationship_type = 'foreign_key';


COMMIT;
