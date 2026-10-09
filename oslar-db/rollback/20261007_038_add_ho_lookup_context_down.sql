BEGIN;

UPDATE lsar_meta.entity_relationship
SET lookup_filter = NULL
WHERE child_entity_code = 'HO'
  AND parent_entity_code = 'XC'
  AND constraint_name = 'fk_ho__xc'
  AND lookup_filter->>'operator' = 'eq_contexts';

COMMIT;
