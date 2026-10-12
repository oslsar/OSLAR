BEGIN;

DO $$
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Wescam trial migration requires open_lsar';
    END IF;
END $$;

-- Refuse to discard trial data. Export/preserve it before a separately reviewed cleanup.
DO $$
DECLARE code text; populated boolean;
BEGIN
    IF EXISTS (SELECT 1 FROM lsar_meta.entity_behavior WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF')) THEN
        RAISE EXCEPTION 'Roll back 042 before 041';
    END IF;
    FOREACH code IN ARRAY ARRAY['WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF'] LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM lsar_core.%I)', code) INTO populated;
        IF populated THEN
            RAISE EXCEPTION '% contains data; rollback cancelled', code;
        END IF;
    END LOOP;
END $$;

DELETE FROM lsar_meta.entity_relationship WHERE child_entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');
DELETE FROM lsar_meta.dbinfo_raw WHERE profile_code = 'WESCAM_OPUS' AND entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');
DELETE FROM lsar_meta.field_def WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');
DELETE FROM lsar_meta.entity WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF') AND profile_code = 'WESCAM_OPUS';
DROP TABLE lsar_core."WESCAM_XF";
DROP TABLE lsar_core."WESCAM_THG";
DROP TABLE lsar_core."WESCAM_THA";
DROP TABLE lsar_core."WESCAM_HO";
DROP TABLE lsar_core."WESCAM_HG";
DROP TABLE lsar_core."WESCAM_HA";
DROP TABLE lsar_core."WESCAM_XC";
DROP TABLE lsar_core."WESCAM_XB";
DROP TABLE lsar_core."WESCAM_XA";
DELETE FROM lsar_meta.profile WHERE profile_code = 'WESCAM_OPUS';

COMMIT;
