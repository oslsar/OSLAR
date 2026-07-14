BEGIN;

DROP INDEX IF EXISTS lsar_meta.field_def_field_uid_uq;

ALTER TABLE lsar_meta.field_def
  DROP COLUMN IF EXISTS field_uid;

DROP INDEX IF EXISTS lsar_meta.entity_entity_uid_uq;

ALTER TABLE lsar_meta.entity
  DROP COLUMN IF EXISTS entity_uid;

COMMIT;
