BEGIN;

ALTER TABLE lsar_meta.entity_relationship
  DROP COLUMN IF EXISTS relationship_label;

COMMIT;
