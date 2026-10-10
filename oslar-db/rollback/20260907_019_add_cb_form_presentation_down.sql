BEGIN;

DELETE FROM lsar_meta.field_behavior
WHERE field_def_id IN
(
    SELECT field_def_id
    FROM lsar_meta.field_def
    WHERE entity_code = 'CB'
);

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'CB'
  AND form_code = 'default-edit';

COMMIT;