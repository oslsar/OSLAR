BEGIN;

ALTER TABLE lsar_meta.entity_relationship
  DROP COLUMN IF EXISTS lookup_filter;

COMMIT;
