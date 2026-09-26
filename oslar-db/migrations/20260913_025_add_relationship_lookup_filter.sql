BEGIN;

ALTER TABLE lsar_meta.entity_relationship
  ADD COLUMN IF NOT EXISTS lookup_filter jsonb;

COMMIT;
