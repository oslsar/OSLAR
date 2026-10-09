BEGIN;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND parent_entity_code = 'XC'
          AND constraint_name = 'fk_ho__xc'
          AND active = TRUE
    ) <> 1 THEN
        RAISE EXCEPTION 'Expected one active HO -> XC relationship';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM lsar_meta.entity_relationship
        WHERE child_entity_code = 'HO'
          AND parent_entity_code = 'XC'
          AND constraint_name = 'fk_ho__xc'
          AND lookup_filter IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'HO -> XC lookup filter already configured; review before applying';
    END IF;
END $$;

UPDATE lsar_meta.entity_relationship
SET lookup_filter = '{
  "operator": "eq_contexts",
  "filters": [
    {
      "column": "EIACODXA",
      "sourceColumn": "EIACODXA"
    },
    {
      "column": "LCNTYPXB",
      "sourceColumn": "LCNTYPXB"
    }
  ]
}'::jsonb
WHERE child_entity_code = 'HO'
  AND parent_entity_code = 'XC'
  AND constraint_name = 'fk_ho__xc';

COMMIT;
