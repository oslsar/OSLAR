BEGIN;

-- ============================================================================
-- XC parent relationship and compiler identity.
--
-- XC is a one-to-one extension of its parent XB record.
-- The inherited XB identity is therefore also the XC composite primary key:
--
--   EIACODXA
--   ALTLCNXB
--   LSACONXB
--   LCNTYPXB
--
-- XC parent selection is restricted in the generated lookup UI to XB records
-- identified as System or End Item:
--
--   SYSIDNXB IN ('S', 'E')
--
-- This is a metadata/UI lookup filter. No physical XC -> XB PostgreSQL
-- foreign-key constraint is added, matching the existing CA -> XB pattern.
-- ============================================================================

-- Primary-key components must be NOT NULL.
ALTER TABLE lsar_core."XC"
  ALTER COLUMN "EIACODXA" SET NOT NULL,
  ALTER COLUMN "ALTLCNXB" SET NOT NULL,
  ALTER COLUMN "LSACONXB" SET NOT NULL,
  ALTER COLUMN "LCNTYPXB" SET NOT NULL;

-- XC currently has no physical primary key.
ALTER TABLE lsar_core."XC"
  ADD CONSTRAINT "XC_PK"
  PRIMARY KEY (
    "EIACODXA",
    "ALTLCNXB",
    "LSACONXB",
    "LCNTYPXB"
  );

-- The inherited XB identity columns are both XC key components
-- and foreign/reference columns to XB.
UPDATE lsar_meta.field_def
SET
  is_key = true,
  is_foreign = true,
  is_mandatory = true
WHERE entity_code = 'XC'
  AND column_name IN (
    'EIACODXA',
    'ALTLCNXB',
    'LSACONXB',
    'LCNTYPXB'
  );

-- Compiler relationship used by generated forms/lookups.
INSERT INTO lsar_meta.entity_relationship (
  child_entity_code,
  parent_entity_code,
  constraint_name,
  relationship_type,
  relationship_label,
  fk_columns,
  pk_columns,
  lookup_filter,
  active,
  comments
)
VALUES (
  'XC',
  'XB',
  'fk_xc__xb',
  'foreign_key',
  'Parent LCN',
  '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb,
  '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb,
  '{"column":"SYSIDNXB","operator":"in","values":["S","E"]}'::jsonb,
  true,
  'XC belongs to XB using composite identity; parent lookup limited to System/End Item XB records.'
)
ON CONFLICT (
  child_entity_code,
  parent_entity_code,
  constraint_name
)
DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  relationship_label = EXCLUDED.relationship_label,
  fk_columns = EXCLUDED.fk_columns,
  pk_columns = EXCLUDED.pk_columns,
  lookup_filter = EXCLUDED.lookup_filter,
  active = EXCLUDED.active,
  comments = EXCLUDED.comments;

COMMIT;
