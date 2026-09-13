BEGIN;

-- ============================================================
-- CA generated form
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
    'CA',
    'default-edit',
    'CA Default Edit Form',
    'edit',
    'Metadata-driven maintenance task form.',
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
            'parent-lcn',
            'Parent LCN',
            'Parent XB LCN and inherited composite key values.',
            10, 2, false, false
        ),
        (
            'task',
            'Task',
            'Task identity, frequency and elapsed-time information.',
            20, 2, false, false
        ),
        (
            'referenced-task',
            'Referenced Task',
            'Optional referenced task identification.',
            30, 2, true, true
        ),
        (
            'aor',
            'Annual Operating Requirement',
            'Annual Operating Requirement information. AG relationship is not yet modelled.',
            40, 2, true, true
        ),
        (
            'maintenance',
            'Maintenance / Conditions',
            'Maintenance indicators, conditions, detection and performance standards.',
            50, 2, true, false
        ),
        (
            'training',
            'Training',
            'Training equipment, location, rationale and recommendation information.',
            60, 2, true, true
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
WHERE fd.entity_code = 'CA'
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
-- CA field behavior
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

        -- Parent LCN
        ('EIACODXA', 'Parent LCN', 10, 'lookup',
         true, false, true, true, true,
         'Select parent LCN',
         'Select the parent XB LCN. The complete composite key is supplied by the selection.',
         30, 'parent-lcn', 2),

        ('ALTLCNXB', 'ALC', 20, 'text',
         true, true, true, true, true,
         NULL, 'Supplied by Parent LCN selection.',
         10, 'parent-lcn', 1),

        ('LSACONXB', 'LCN', 30, 'text',
         true, true, true, true, true,
         NULL, 'Supplied by Parent LCN selection.',
         24, 'parent-lcn', 1),

        ('LCNTYPXB', 'LCN Type', 40, 'text',
         true, true, true, true, true,
         NULL, 'Supplied by Parent LCN selection.',
         10, 'parent-lcn', 1),

        -- Task
        ('TASKCDCA', 'Task Code', 50, 'text',
         true, false, true, true, true,
         NULL, NULL,
         14, 'task', 1),

        ('TASKIDCA', 'Task Identification', 60, 'text',
         false, false, true, true, true,
         NULL, NULL,
         36, 'task', 1),

        ('TSKFRQCA', 'Task Frequency', 70, 'decimal',
         false, false, false, true, true,
         NULL, NULL,
         16, 'task', 1),

        ('MSDMETCA', 'Measured Mean Elapsed Time', 80, 'decimal',
         false, false, false, true, true,
         NULL, NULL,
         16, 'task', 1),

        ('MSDMMHCA', 'Measured Mean Man Hours', 90, 'decimal',
         false, false, false, true, true,
         NULL, NULL,
         16, 'task', 1),

        ('PRDMMHCA', 'Predicted Mean Man Hours', 100, 'decimal',
         false, false, false, true, true,
         NULL, NULL,
         16, 'task', 1),

        -- Referenced Task
        ('REFEIACA', 'Referenced EIAC', 110, 'text',
         false, false, false, false, false,
         NULL, NULL,
         16, 'referenced-task', 1),

        ('REFLCNCA', 'Referenced LCN', 120, 'text',
         false, false, false, false, false,
         NULL, NULL,
         24, 'referenced-task', 1),

        ('REFALCCA', 'Referenced ALC', 130, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'referenced-task', 1),

        ('REFTYPCA', 'Referenced LCN Type', 140, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'referenced-task', 1),

        ('REFTSKCA', 'Referenced Task Code', 150, 'text',
         false, false, false, false, false,
         NULL, NULL,
         14, 'referenced-task', 1),

        -- Annual Operating Requirement
        -- These remain deliberately optional until AG is modelled.
        ('AORALCCA', 'AOR ALC', 160, 'text',
         false, false, false, false, false,
         NULL,
         'Temporarily optional until the AG relationship is modelled.',
         10, 'aor', 1),

        ('AORLCNCA', 'AOR LCN', 170, 'text',
         false, false, false, false, false,
         NULL,
         'Temporarily optional until the AG relationship is modelled.',
         24, 'aor', 1),

        ('AORTYPCA', 'Annual Operating Requirement LCN Type', 180, 'text',
         false, false, false, false, false,
         NULL,
         'Temporarily optional until the AG relationship is modelled.',
         12, 'aor', 1),

        ('AORMSBAG', 'AOR Measurement Base', 190, 'text',
         false, false, false, false, false,
         NULL,
         'Temporarily optional until the AG relationship is modelled.',
         12, 'aor', 1),

        ('AORMSBCA', 'Task AOR Measurement Base', 200, 'text',
         false, false, false, false, false,
         NULL, NULL,
         12, 'aor', 1),

        -- Maintenance / Conditions
        ('FTRNRQCA', 'Facility Requirement', 210, 'boolean',
         false, false, false, true, true,
         NULL, NULL,
         14, 'maintenance', 1),

        ('HRDCPCCA', 'Hardness Critical Procedure', 220, 'text',
         false, false, false, true, true,
         NULL, NULL,
         12, 'maintenance', 1),

        ('HAZMPCCA', 'Hazardous Maintenance Procedure', 230, 'text',
         false, false, false, true, true,
         NULL, NULL,
         12, 'maintenance', 1),

        ('PMCSIDCA', 'PMCS Indicator', 240, 'boolean',
         false, false, false, true, true,
         NULL, NULL,
         14, 'maintenance', 1),

        ('PMDTECCA', 'Primary Means of Detection', 250, 'text',
         false, false, false, true, true,
         NULL, NULL,
         12, 'maintenance', 1),

        ('SMDTECCA', 'Secondary Means of Detection', 260, 'text',
         false, false, false, true, true,
         NULL, NULL,
         12, 'maintenance', 1),

        ('TCONDACA', 'Task Condition A', 270, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('TCONDBCA', 'Task Condition B', 280, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('TCONDCCA', 'Task Condition C', 290, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('TSKCRCCA', 'Task Criticality', 300, 'boolean',
         false, false, false, true, true,
         NULL, NULL,
         14, 'maintenance', 1),

        ('PRSTDACA', 'Task Performance Standard A', 310, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('PRSTDBCA', 'Task Performance Standard B', 320, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('PRSTDCCA', 'Task Performance Standard C', 330, 'text',
         false, false, false, false, false,
         NULL, NULL,
         10, 'maintenance', 1),

        ('TSEREQCA', 'Tool / Support Equipment Requirement', 340, 'text',
         false, false, false, true, true,
         NULL, NULL,
         12, 'maintenance', 1),

        -- Training
        ('TRNRQCCA', 'Training Equipment Requirement', 350, 'boolean',
         false, false, false, true, true,
         NULL, NULL,
         14, 'training', 1),

        ('TRNLOCCA', 'Training Location Rationale', 360, 'text',
         false, false, false, false, false,
         NULL, NULL,
         12, 'training', 1),

        ('TRNRATCA', 'Training Rationale', 370, 'text',
         false, false, false, false, false,
         NULL, NULL,
         12, 'training', 1),

        ('TRNRECCA', 'Training Recommendation Type', 380, 'text',
         false, false, false, false, false,
         NULL, NULL,
         12, 'training', 1)

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
  ON fd.entity_code = 'CA'
 AND fd.column_name = v.column_name

JOIN lsar_meta.form_definition formdef
  ON formdef.entity_code = 'CA'
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
-- Use the metadata-driven edit form.
-- Existing CRUD permissions are intentionally preserved.
-- ============================================================

UPDATE lsar_meta.entity_behavior
SET
    default_form_code = 'default-edit',
    updated_at = now()
WHERE entity_code = 'CA';


-- ============================================================
-- Human-readable parent relationship label
-- ============================================================

UPDATE lsar_meta.entity_relationship
SET relationship_label = 'Parent LCN'
WHERE child_entity_code = 'CA'
  AND parent_entity_code = 'XB'
  AND relationship_type = 'foreign_key';


COMMIT;
