BEGIN;

DELETE FROM lsar_meta.field_behavior
WHERE field_def_id IN
(
    SELECT field_def_id
    FROM lsar_meta.field_def
    WHERE entity_code = 'XB'
);

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'XB'
  AND form_code = 'default-edit';

UPDATE lsar_meta.entity_behavior
SET
    default_form_code = NULL,
    allow_create = false,
    allow_edit = false,
    allow_delete = false,
    updated_at = now()
WHERE entity_code = 'XB';

UPDATE lsar_meta.entity_relationship
SET relationship_label = NULL
WHERE child_entity_code = 'XB'
  AND parent_entity_code = 'XA'
  AND relationship_type = 'foreign_key';

COMMIT;
