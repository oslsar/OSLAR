BEGIN;

ALTER TABLE lsar_meta.entity_relationship
    DROP CONSTRAINT IF EXISTS
        entity_relationship_lookup_anchor_in_fk_chk;

ALTER TABLE lsar_meta.entity_relationship
    DROP COLUMN IF EXISTS lookup_anchor_column;

COMMIT;
