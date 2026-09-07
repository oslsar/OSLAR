BEGIN;

ALTER TABLE lsar_meta.entity_relationship
  ADD COLUMN IF NOT EXISTS relationship_label text;

UPDATE lsar_meta.entity_relationship
SET relationship_label = 'Parent Task'
WHERE child_entity_code = 'CB'
  AND parent_entity_code = 'CA'
  AND relationship_type = 'foreign_key';

COMMIT;
