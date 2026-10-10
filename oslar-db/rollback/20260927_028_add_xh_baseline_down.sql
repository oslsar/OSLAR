BEGIN;

DROP TABLE IF EXISTS lsar_core."XH";

DELETE FROM lsar_meta.field_def
WHERE entity_code = 'XH';

DELETE FROM lsar_meta.entity
WHERE entity_code = 'XH';

DELETE FROM lsar_meta.dbinfo_raw
WHERE profile_code = 'BASELINE'
  AND entity_code = 'XH'
  AND field IN
  (
      'CAGECDXH',
      'CACITYXH',
      'CANAMEXH',
      'CANATNXH',
      'CAPOZOXH',
      'CASTATXH',
      'CASTREXH'
  );

COMMIT;
