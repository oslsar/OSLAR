BEGIN;

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 4,
  element_name =
    'Logistics Support Analysis Control Number Type',
  geia_short_name = 'lcntype',
  format_spec = 'string(1)',
  key_class = 'F',
  is_key = false,
  is_foreign = true,
  is_mandatory = true,
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND column_name = 'AORTYPCA';

DELETE FROM lsar_meta.field_def
WHERE entity_code = 'CA'
  AND column_name = 'AORMSBCA'
  AND ordinal_pos = 25;

UPDATE lsar_meta.field_def
SET
  column_name = 'AORMSBCA',
  ordinal_pos = 14,
  geia_short_name = '0',
  element_name =
    'Annual Operating Requirement Measurement Base (Referencing to AG)',
  format_spec = 'string(1)',
  key_class = '0',
  is_key = false,
  is_foreign = false,
  is_mandatory = false,
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND column_name = 'AORMSBAG'
  AND ordinal_pos = 14;

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 30,
  geia_short_name = 'taskdesc',
  element_name = 'Task Description',
  format_spec = 'string(unlimited)',
  key_class = '0',
  is_key = false,
  is_foreign = false,
  is_mandatory = false,
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND column_name = 'TASKIDCA';

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 20,
  geia_short_name = 'prdmnelt'
WHERE entity_code = 'CA'
  AND column_name = 'MSDMMHCA';

UPDATE lsar_meta.field_def
SET ordinal_pos = 31
WHERE entity_code = 'CA'
  AND column_name = 'TSKFRQCA';

COMMIT;
