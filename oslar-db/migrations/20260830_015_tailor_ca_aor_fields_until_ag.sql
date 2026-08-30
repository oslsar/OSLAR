BEGIN;

-- ============================================================
-- CA AOR relationship preparation / temporary tailoring
--
-- Baseline:
--   AORALCCA
--   AORLCNCA
--   AORTYPCA
--   AORMSBAG
--
-- are components originating from AG.
--
-- AG is not yet implemented in lsar_core, so temporarily make
-- these fields optional at the behaviour layer while preserving
-- their baseline LSAR metadata.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Correct remaining baseline source metadata
-- ------------------------------------------------------------

UPDATE lsar_meta.dbinfo_raw
SET
  is_foreign = 'TRUE',
  is_mandatory = 'TRUE',
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND ordinal_pos IN ('11', '12')
  AND field IN ('AORALCCA', 'AORLCNCA');


-- ------------------------------------------------------------
-- 2. Correct normalized baseline metadata
-- ------------------------------------------------------------

UPDATE lsar_meta.field_def
SET
  is_foreign = true,
  is_mandatory = true,
  originates_in_entity = 'AG'
WHERE entity_code = 'CA'
  AND column_name IN (
    'AORALCCA',
    'AORLCNCA',
    'AORTYPCA',
    'AORMSBAG'
  );


-- ------------------------------------------------------------
-- 3. Temporary project tailoring
--
-- required = false explicitly overrides field_def.is_mandatory.
-- This remains in effect until AG and its parent A-tables are
-- implemented and the composite AG lookup can be registered.
-- ------------------------------------------------------------

INSERT INTO lsar_meta.field_behavior (
  field_def_id,
  required,
  active
)
SELECT
  field_def_id,
  false,
  true
FROM lsar_meta.field_def
WHERE entity_code = 'CA'
  AND column_name IN (
    'AORALCCA',
    'AORLCNCA',
    'AORTYPCA',
    'AORMSBAG'
  )
ON CONFLICT (field_def_id)
DO UPDATE SET
  required = false,
  active = true,
  updated_at = now();

COMMIT;
