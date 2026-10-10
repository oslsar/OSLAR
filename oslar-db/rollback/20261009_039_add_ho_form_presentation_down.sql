BEGIN;

DO $$
BEGIN
    IF (
        SELECT count(*)
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HO'
          AND show_in_navigation = FALSE
          AND allow_create = FALSE
          AND allow_edit = FALSE
          AND allow_delete = FALSE
    ) <> 1 THEN
        RAISE EXCEPTION
            'Unexpected HO behavior state; rollback cancelled';
    END IF;
END $$;

DELETE FROM lsar_meta.field_behavior fb
USING lsar_meta.field_def fd
WHERE fb.field_def_id = fd.field_def_id
  AND fd.entity_code = 'HO';

DELETE FROM lsar_meta.form_section fs
USING lsar_meta.form_definition f
WHERE fs.form_definition_id = f.form_definition_id
  AND f.entity_code = 'HO';

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'HO';

DELETE FROM lsar_meta.entity_behavior
WHERE entity_code = 'HO';

COMMIT;
