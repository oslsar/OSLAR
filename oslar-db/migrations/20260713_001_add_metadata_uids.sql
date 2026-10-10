BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE lsar_meta.entity
  ADD COLUMN IF NOT EXISTS entity_uid uuid;

UPDATE lsar_meta.entity
SET entity_uid = gen_random_uuid()
WHERE entity_uid IS NULL;

ALTER TABLE lsar_meta.entity
  ALTER COLUMN entity_uid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN entity_uid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entity_entity_uid_uq
  ON lsar_meta.entity (entity_uid);

ALTER TABLE lsar_meta.field_def
  ADD COLUMN IF NOT EXISTS field_uid uuid;

UPDATE lsar_meta.field_def
SET field_uid = gen_random_uuid()
WHERE field_uid IS NULL;

ALTER TABLE lsar_meta.field_def
  ALTER COLUMN field_uid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN field_uid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS field_def_field_uid_uq
  ON lsar_meta.field_def (field_uid);

COMMIT;
