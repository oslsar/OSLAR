BEGIN;

UPDATE lsar_meta.entity_relationship
SET lookup_filter = NULL
WHERE child_entity_code = 'HG'
  AND parent_entity_code = 'HA'
  AND constraint_name = 'fk_hg__ha';

COMMIT;
