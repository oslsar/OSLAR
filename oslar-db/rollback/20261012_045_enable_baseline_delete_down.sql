BEGIN;

DO $$
DECLARE
    affected_rows integer;
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Baseline delete migration requires open_lsar';
    END IF;

    UPDATE lsar_meta.entity_behavior
    SET allow_delete = FALSE
    WHERE entity_code IN ('XA', 'XB', 'XC', 'XH', 'HA', 'HG', 'HO', 'CA', 'CB');

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows <> 9 THEN
        RAISE EXCEPTION 'Expected exactly nine baseline behavior rows';
    END IF;
END $$;

COMMIT;
