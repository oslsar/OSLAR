BEGIN;

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'HA'
  AND parent_entity_code = 'XA'
  AND constraint_name = 'fk_ha__xa';

DELETE FROM lsar_meta.entity_relationship
WHERE child_entity_code = 'HA'
  AND parent_entity_code = 'XH'
  AND constraint_name = 'fk_ha__xh';

COMMIT;
