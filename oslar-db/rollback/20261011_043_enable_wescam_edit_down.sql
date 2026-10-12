BEGIN;

DO $$
DECLARE
    affected_rows integer;
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Wescam trial migration requires open_lsar';
    END IF;

    -- Change only edit permission; all other behavior and physical keys stay intact.
    UPDATE lsar_meta.entity_behavior
    SET allow_edit = FALSE
    WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows <> 9 THEN
        RAISE EXCEPTION 'Expected nine Wescam behavior rows; apply 041/042 first';
    END IF;
END $$;

COMMIT;
