BEGIN;

INSERT INTO lsar_meta.field_def (
  entity_code,
  column_name,
  ordinal_pos,
  format_spec,
  element_name,
  geia_short_name,
  key_class,
  is_key,
  is_foreign,
  is_mandatory,
  originates_in_entity,
  include_element,
  deprecated,
  tailoring_notes
)
VALUES
  (
    'CA',
    'LSACONXB',
    3,
    'string(18)',
    'Logistics Support Analysis Control Number',
    'lcn',
    'F',
    false,
    true,
    false,
    'XB',
    true,
    false,
    'Added to reconcile CA physical schema with the CA-to-XB composite foreign key.'
  ),
  (
    'CA',
    'LCNTYPXB',
    4,
    'string(1)',
    'Logistics Support Analysis Control Number Type',
    'lcntype',
    'F',
    false,
    true,
    false,
    'XB',
    true,
    false,
    'Added to reconcile CA physical schema with the CA-to-XB composite foreign key.'
  ),
  (
    'CA',
    'TASKCDCA',
    5,
    'string(7)',
    'Task Code',
    'taskcode',
    'P',
    true,
    false,
    true,
    'CA',
    true,
    false,
    'Added to reconcile field metadata with the physical CA primary key.'
  )
ON CONFLICT (entity_code, column_name) DO NOTHING;

COMMIT;
