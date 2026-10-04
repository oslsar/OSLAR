BEGIN;

-- Roll back only metadata created for HG by migration 035.
-- Requires that no later HG form customizations need to be retained.
DELETE FROM lsar_meta.field_behavior fb
USING lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'HG';

DELETE FROM lsar_meta.form_section fs
USING lsar_meta.form_definition f
WHERE fs.form_definition_id = f.form_definition_id
  AND f.entity_code = 'HG'
  AND f.form_code = 'default-edit';

DELETE FROM lsar_meta.form_definition
WHERE entity_code = 'HG' AND form_code = 'default-edit';

DELETE FROM lsar_meta.entity_behavior
WHERE entity_code = 'HG';

COMMIT;
