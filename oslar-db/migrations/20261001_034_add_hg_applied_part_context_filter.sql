BEGIN;

-- Restrict HG's Applied Part lookup to the End Item
-- selected through its Parent LCN lookup.

UPDATE lsar_meta.entity_relationship
SET lookup_filter = '{
    "column": "EIACODXA",
    "operator": "eq_context",
    "sourceColumn": "EIACODXA"
}'::jsonb
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'HA'
  AND constraint_name = 'fk_hg__ha';

COMMIT;
