BEGIN;

-- ---------------------------------------------------------------------------
-- 1. CB form definition
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
    'CB',
    'default-edit',
    'CB Default Edit Form',
    'edit',
    'Metadata-driven CB subtask form',
    true
)
ON CONFLICT (entity_code, form_code)
DO UPDATE SET
    form_name   = EXCLUDED.form_name,
    form_type   = EXCLUDED.form_type,
    description = EXCLUDED.description,
    active      = EXCLUDED.active,
    updated_at  = now();


-- ---------------------------------------------------------------------------
-- 2. CB form sections
-- ---------------------------------------------------------------------------

WITH cb_form AS
(
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'CB'
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
    cb_form.form_definition_id,
    x.section_code,
    x.section_name,
    x.description,
    x.display_order,
    x.column_count,
    x.collapsible,
    x.initially_collapsed,
    true
FROM cb_form
CROSS JOIN
(
    VALUES
        (
            'parent-task',
            'Parent Task',
            'Parent CA task and inherited composite key values',
            10,
            2,
            false,
            false
        ),
        (
            'subtask',
            'Subtask',
            'Subtask identification and timing',
            20,
            2,
            false,
            false
        ),
        (
            'referenced-subtask',
            'Referenced Subtask',
            'Optional referenced subtask key values',
            30,
            2,
            true,
            true
        ),
        (
            'work-area',
            'Work Area',
            'Element and work area information',
            40,
            2,
            true,
            false
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
    active              = true,
    updated_at          = now();


-- ---------------------------------------------------------------------------
-- 3. CB field behavior
-- ---------------------------------------------------------------------------

WITH cb_sections AS
(
    SELECT
        fs.form_section_id,
        fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'CB'
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
    false,
    x.searchable,
    x.sortable,
    x.filterable,
    x.placeholder,
    x.help_text,
    x.default_width,
    cs.form_section_id,
    x.column_span,
    true
FROM
(
    VALUES

        -- Parent Task
        ('EIACODXA', 'Parent Task',              10, 'lookup',   true,  false, true,  true,  true,  'Select parent task', NULL, 30, 'parent-task', 2),
        ('LSACONXB', 'LCN',                      20, 'text',     true,  true,  true,  true,  true,  NULL, 'Supplied by Parent Task selection', 24, 'parent-task', 1),
        ('ALTLCNXB', 'ALC',                      30, 'text',     true,  true,  true,  true,  true,  NULL, 'Supplied by Parent Task selection', 10, 'parent-task', 1),
        ('LCNTYPXB', 'LCN Type',                 40, 'text',     true,  true,  true,  true,  true,  NULL, 'Supplied by Parent Task selection', 10, 'parent-task', 1),
        ('TASKCDCA', 'Task Code',                50, 'text',     true,  true,  true,  true,  true,  NULL, 'Supplied by Parent Task selection', 14, 'parent-task', 1),

        -- Subtask
        ('SUBNUMCB', 'Subtask Number',           10, 'number',   true,  false, true,  true,  true,  NULL, NULL, 12, 'subtask', 1),
        ('SUBTIDCB', 'Subtask Identification',   20, 'text',     false, false, true,  true,  true,  NULL, NULL, 36, 'subtask', 1),
        ('SUBTDECB', 'Subtask Description',      30, 'textarea', false, false, true,  false, false, NULL, NULL, 80, 'subtask', 2),
        ('SBMMETCB', 'Mean Minute Elapsed Time', 40, 'decimal',  false, false, false, true,  false, NULL, NULL, 16, 'subtask', 1),

        -- Referenced Subtask
        ('RFDEIACB', 'Referenced EIAC',          10, 'text',     false, false, false, false, false, NULL, NULL, 20, 'referenced-subtask', 1),
        ('RFDLCNCB', 'Referenced LCN',           20, 'text',     false, false, false, false, false, NULL, NULL, 24, 'referenced-subtask', 1),
        ('RFDALCCB', 'Referenced ALC',           30, 'text',     false, false, false, false, false, NULL, NULL, 10, 'referenced-subtask', 1),
        ('RFDTYPCB', 'Referenced LCN Type',      40, 'text',     false, false, false, false, false, NULL, NULL, 10, 'referenced-subtask', 1),
        ('RFDTCDCB', 'Referenced Task Code',     50, 'text',     false, false, false, false, false, NULL, NULL, 14, 'referenced-subtask', 1),
        ('RFDSUBCB', 'Referenced Subtask Number',60, 'number',   false, false, false, false, false, NULL, NULL, 12, 'referenced-subtask', 1),

        -- Work Area
        ('ELEMNTCB', 'Element Indicator',        10, 'text',     false, false, false, false, false, NULL, NULL, 20, 'work-area', 1),
        ('SUBWACCB', 'Work Area Access',         20, 'text',     false, false, false, false, false, NULL, NULL, 20, 'work-area', 1),
        ('SUBWAZCB', 'Work Area Zone',           30, 'text',     false, false, false, false, false, NULL, NULL, 20, 'work-area', 1)

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
  ON fd.entity_code = 'CB'
 AND fd.column_name = x.column_name
 AND fd.deprecated = false
JOIN cb_sections cs
  ON cs.section_code = x.section_code
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
    active          = true,
    updated_at      = now();

COMMIT;