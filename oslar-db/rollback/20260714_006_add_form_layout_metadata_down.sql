BEGIN;

ALTER TABLE lsar_meta.field_behavior
  DROP CONSTRAINT IF EXISTS field_behavior_column_span_chk,
  DROP CONSTRAINT IF EXISTS field_behavior_form_section_id_fkey;

ALTER TABLE lsar_meta.field_behavior
  DROP COLUMN IF EXISTS column_span,
  DROP COLUMN IF EXISTS form_section_id;

DROP TABLE IF EXISTS lsar_meta.form_section;
DROP TABLE IF EXISTS lsar_meta.form_definition;

COMMIT;
