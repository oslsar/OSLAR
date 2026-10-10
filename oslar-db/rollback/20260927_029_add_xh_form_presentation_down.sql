BEGIN;

DELETE FROM lsar_meta.field_behavior
WHERE field_def_id IN
(
    SELECT field_def_id
    FROM lsar_meta.field_def
    WHERE entity_code = 'XH'
);

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'XH'
  AND form_code = 'default-edit';

DELETE FROM lsar_meta.entity_behavior
WHERE entity_code = 'XH';

COMMIT;
