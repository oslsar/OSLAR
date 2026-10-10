BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HO'
          AND active = TRUE
          AND show_in_navigation = TRUE
          AND allow_create = TRUE
          AND allow_edit = FALSE
          AND allow_delete = FALSE
    ) <> 1 THEN
        RAISE EXCEPTION 'Unexpected HO configuration; rollback cancelled';
    END IF;
END $$;

UPDATE lsar_meta.entity_behavior
SET show_in_navigation = FALSE,
    allow_create = FALSE,
    updated_at = NOW()
WHERE entity_code = 'HO';

COMMIT;
