BEGIN;

DO $$
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Wescam trial migration requires open_lsar';
    END IF;
END $$;

-- Remove presentation before 041 rollback. Physical rows are left intact.
DELETE FROM lsar_meta.field_behavior fb USING lsar_meta.field_def fd
WHERE fb.field_def_id = fd.field_def_id AND fd.entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');
DELETE FROM lsar_meta.entity_behavior WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');
COMMIT;
