BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_behavior
        WHERE entity_code = 'HO'
          AND active = TRUE
          AND show_in_navigation = FALSE
          AND allow_create = FALSE
          AND allow_edit = FALSE
          AND allow_delete = FALSE
    ) <> 1 THEN
        RAISE EXCEPTION 'Unexpected HO configuration; migration cancelled';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM lsar_meta.field_behavior fb
        JOIN lsar_meta.field_def fd USING (field_def_id)
        WHERE fd.entity_code = 'HO'
          AND fd.include_element
          AND NOT fd.deprecated
          AND fb.active
    ) <> 8 THEN
        RAISE EXCEPTION 'Expected 8 configured HO fields';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND active
          AND parent_entity_code IN ('HG', 'XC')
    ) <> 2 THEN
        RAISE EXCEPTION 'Expected active HO relationships to HG and XC';
    END IF;
END $$;

UPDATE lsar_meta.entity_behavior
SET show_in_navigation = TRUE,
    allow_create = TRUE,
    updated_at = NOW()
WHERE entity_code = 'HO';

COMMIT;
