BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HG'
          AND active = TRUE
          AND show_in_navigation = FALSE
          AND allow_create = FALSE
          AND allow_edit = FALSE
          AND allow_delete = FALSE
    ) <> 1 THEN
        RAISE EXCEPTION 'Unexpected HG configuration; migration cancelled';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM lsar_meta.field_behavior fb
        JOIN lsar_meta.field_def fd USING (field_def_id)
        WHERE fd.entity_code = 'HG'
          AND fd.include_element
          AND NOT fd.deprecated
          AND fb.active
    ) <> 70 THEN
        RAISE EXCEPTION 'Expected 70 configured HG fields';
    END IF;
END $$;

UPDATE lsar_meta.entity_behavior
SET show_in_navigation = TRUE,
    allow_create = TRUE,
    allow_edit = TRUE,
    updated_at = NOW()
WHERE entity_code = 'HG';

COMMIT;
