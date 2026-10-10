BEGIN;

-- ============================================================
-- Remove CA behaviors introduced by migration 023,
-- except the four pre-existing AOR tailoring rows.
-- ============================================================

DELETE FROM lsar_meta.field_behavior fb
USING lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'CA'
  AND fd.column_name NOT IN
  (
      'AORALCCA',
      'AORLCNCA',
      'AORTYPCA',
      'AORMSBAG'
  );


-- ============================================================
-- Restore the four original AOR tailoring rows exactly.
-- ============================================================

UPDATE lsar_meta.field_behavior fb
SET
    display_label =
        CASE fd.column_name
            WHEN 'AORTYPCA'
                THEN 'Annual Operating Requirement LCN Type'
            ELSE NULL
        END,
    display_order = NULL,
    control_type = NULL,
    required = false,
    read_only = NULL,
    hidden = false,
    searchable = NULL,
    sortable = NULL,
    filterable = NULL,
    placeholder = NULL,
    help_text = NULL,
    default_width = NULL,
    active = true,
    form_section_id = NULL,
    column_span = NULL,
    updated_at = now()
FROM lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'CA'
  AND fd.column_name IN
  (
      'AORALCCA',
      'AORLCNCA',
      'AORTYPCA',
      'AORMSBAG'
  );


-- ============================================================
-- Remove form definition and its sections.
-- ============================================================

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'CA'
  AND form_code = 'default-edit';


-- ============================================================
-- Restore entity behavior.
-- CRUD permissions are unchanged by migration 023.
-- ============================================================

UPDATE lsar_meta.entity_behavior
SET
    default_form_code = NULL,
    updated_at = now()
WHERE entity_code = 'CA';


-- ============================================================
-- Restore relationship presentation.
-- ============================================================

UPDATE lsar_meta.entity_relationship
SET relationship_label = NULL
WHERE child_entity_code = 'CA'
  AND parent_entity_code = 'XB'
  AND relationship_type = 'foreign_key';


COMMIT;
