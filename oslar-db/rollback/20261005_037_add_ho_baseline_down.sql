BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM lsar_core."HO") THEN
        RAISE EXCEPTION 'HO contains records; rollback cancelled';
    END IF;
END $$;

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'HO'
  AND constraint_name IN ('fk_ho__hg', 'fk_ho__xc');

DROP TABLE IF EXISTS lsar_core."HO";

DELETE FROM lsar_meta.field_def
WHERE entity_code = 'HO';

DELETE FROM lsar_meta.entity
WHERE entity_code = 'HO';

DELETE FROM lsar_meta.dbinfo_raw
WHERE profile_code = 'BASELINE'
  AND entity_code = 'HO';

COMMIT;
