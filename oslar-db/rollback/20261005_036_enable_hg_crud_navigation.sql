BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HG'
          AND show_in_navigation = TRUE
          AND allow_create = TRUE
          AND allow_edit = TRUE
          AND allow_delete = FALSE
    ) <> 1 THEN
        RAISE EXCEPTION 'Unexpected HG configuration; rollback cancelled';
    END IF;
END $$;

UPDATE lsar_meta.entity_behavior
SET show_in_navigation = FALSE,
    allow_create = FALSE,
    allow_edit = FALSE,
    updated_at = NOW()
WHERE entity_code = 'HG';

COMMIT;
