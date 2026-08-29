BEGIN;

-- ============================================================
-- Correct CA baseline metadata.
--
-- Scope:
--   * Repair known corrupt CA rows in dbinfo_raw
--   * Repair normalized field_def metadata
--   * Preserve the deliberate Phase-2 CA composite key
--   * Do NOT create AG relationships yet
--   * Do NOT create TASKDECA metadata
-- ============================================================


-- ------------------------------------------------------------
-- 1. Repair corrupted dbinfo_raw CA rows
-- ------------------------------------------------------------

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'LSACONXB',
  geia_short_name = 'lcn',
  element_name = 'Logistics Support Analysis Control Number',
  format_spec = 'string(18)',
  key = 'F',
  is_key = 'FALSE',
  is_foreign = 'TRUE',
  is_mandatory = 'TRUE',
  originates_in_entity = 'XB'
WHERE entity_code = 'CA'
  AND ordinal_pos = '3';

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'LCNTYPXB',
  geia_short_name = 'lcntype',
  element_name = 'Logistics Support Analysis Control Number Type',
  format_spec = 'string(1)',
  key = 'F',
  is_key = 'FALSE',
  is_foreign = 'TRUE',
  is_mandatory = 'TRUE',
  originates_in_entity = 'XB'
WHERE entity_code = 'CA'
  AND ordinal_pos = '4';

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'TASKCDCA',
  geia_short_name = 'taskcode',
  element_name = 'Task Code',
  format_spec = 'string(7)',
  key = 'P',
  is_key = 'TRUE',
  is_foreign = 'FALSE',
  is_mandatory = 'TRUE',
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND ordinal_pos = '5';

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'AORTYPCA',
  geia_short_name = 'lcntype',
  element_name =
    'Annual Operating Requirement Logistics Support Analysis Control Number Type (Referencing to AG)',
  format_spec = 'string(1)',
  key = '0',
  is_key = 'FALSE',
  is_foreign = 'TRUE',
  is_mandatory = 'TRUE',
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND ordinal_pos = '13';

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'AORMSBAG',
  geia_short_name = 'mmsdurmb',
  element_name =
    'Annual Operating Requirement Measurement Base',
  format_spec = 'string(1)',
  key = '0',
  is_key = 'FALSE',
  is_foreign = 'TRUE',
  is_mandatory = 'TRUE',
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND ordinal_pos = '14';

UPDATE lsar_meta.dbinfo_raw
SET
  field = 'TASKIDCA',
  geia_short_name = 'taskid',
  element_name = 'Task Identification',
  format_spec = 'string(36)',
  key = 'I',
  is_key = 'FALSE',
  is_foreign = 'FALSE',
  is_mandatory = 'FALSE',
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND ordinal_pos = '32';


-- ------------------------------------------------------------
-- 2. Repair existing normalized field_def rows in place
-- ------------------------------------------------------------

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 13,
  geia_short_name = 'lcntype',
  element_name =
    'Annual Operating Requirement Logistics Support Analysis Control Number Type (Referencing to AG)',
  format_spec = 'string(1)',
  key_class = '0',
  is_key = false,
  is_foreign = true,
  is_mandatory = true,
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND column_name = 'AORTYPCA';

-- The current AORMSBCA row at source ordinal 14 is actually AORMSBAG.
UPDATE lsar_meta.field_def
SET
  column_name = 'AORMSBAG',
  ordinal_pos = 14,
  geia_short_name = 'mmsdurmb',
  element_name =
    'Annual Operating Requirement Measurement Base',
  format_spec = 'string(1)',
  key_class = '0',
  is_key = false,
  is_foreign = true,
  is_mandatory = true,
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND column_name = 'AORMSBCA'
  AND ordinal_pos = 14;

-- Restore the genuine AORMSBCA definition if it does not yet exist.
INSERT INTO lsar_meta.field_def (
  entity_code,
  column_name,
  ordinal_pos,
  format_spec,
  ded,
  geia_short_name,
  element_name,
  key_class,
  is_key,
  is_foreign,
  is_mandatory,
  originates_in_entity,
  include_element,
  deprecated
)
SELECT
  'CA',
  'AORMSBCA',
  25,
  'string(1)',
  '238',
  'taanormb',
  'Task Annual Operating Requirement Measurement Base',
  '0',
  false,
  false,
  false,
  '0',
  true,
  false
WHERE NOT EXISTS (
  SELECT 1
  FROM lsar_meta.field_def
  WHERE entity_code = 'CA'
    AND column_name = 'AORMSBCA'
);

-- TASKIDCA is Task Identification, not Task Description.
UPDATE lsar_meta.field_def
SET
  ordinal_pos = 32,
  geia_short_name = 'taskid',
  element_name = 'Task Identification',
  format_spec = 'string(36)',
  key_class = 'I',
  is_key = false,
  is_foreign = false,
  is_mandatory = false,
  originates_in_entity = '0'
WHERE entity_code = 'CA'
  AND column_name = 'TASKIDCA';


-- ------------------------------------------------------------
-- 3. Correct other known baseline metadata values
-- ------------------------------------------------------------

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 19,
  geia_short_name = 'msdmnmhr',
  element_name = 'Measured Mean Man Hours',
  format_spec = 'decimal(6,2)'
WHERE entity_code = 'CA'
  AND column_name = 'MSDMMHCA';

UPDATE lsar_meta.field_def
SET
  ordinal_pos = 31,
  geia_short_name = 'tskfreq',
  element_name = 'Task Frequency',
  format_spec = 'decimal(8,4)'
WHERE entity_code = 'CA'
  AND column_name = 'TSKFRQCA';


-- ------------------------------------------------------------
-- 4. Preserve deliberate Phase-2 CA composite key
-- ------------------------------------------------------------

UPDATE lsar_meta.field_def
SET
  is_key = true,
  is_foreign = true,
  is_mandatory = true
WHERE entity_code = 'CA'
  AND column_name IN (
    'EIACODXA',
    'ALTLCNXB',
    'LSACONXB',
    'LCNTYPXB'
  );

UPDATE lsar_meta.field_def
SET
  is_key = true,
  is_foreign = false,
  is_mandatory = true
WHERE entity_code = 'CA'
  AND column_name = 'TASKCDCA';

-- ------------------------------------------------------------
-- 5. Remove known invalid duplicate raw-source artifacts
-- ------------------------------------------------------------

-- No valid CA source field exists at ordinal 20.
DELETE FROM lsar_meta.dbinfo_raw
WHERE entity_code = 'CA'
  AND ordinal_pos = '20'
  AND field = 'MSDMMHCA';

-- TASKDECA / Task Description is not a valid CA field.
-- Remove the corrupt duplicate TASKIDCA source row at ordinal 30.
DELETE FROM lsar_meta.dbinfo_raw
WHERE entity_code = 'CA'
  AND ordinal_pos = '30'
  AND field = 'TASKIDCA'
  AND geia_short_name = 'taskdesc';

COMMIT;