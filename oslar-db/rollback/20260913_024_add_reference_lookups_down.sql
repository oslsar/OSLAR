BEGIN;

-- Restore CA referenced-task fields to migration 023 presentation.

UPDATE lsar_meta.field_behavior fb
SET
    control_type = 'text',
    read_only = false,
    help_text = NULL,
    updated_at = now()
FROM lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'CA'
  AND fd.column_name IN
  (
      'REFEIACA',
      'REFALCCA',
      'REFLCNCA',
      'REFTYPCA',
      'REFTSKCA'
  );


-- Restore CB referenced-subtask fields to migration 019 presentation.

UPDATE lsar_meta.field_behavior fb
SET
    control_type = CASE
        WHEN fd.column_name = 'RFDSUBCB' THEN 'number'
        ELSE 'text'
    END,
    read_only = false,
    help_text = NULL,
    updated_at = now()
FROM lsar_meta.field_def fd
WHERE fd.field_def_id = fb.field_def_id
  AND fd.entity_code = 'CB'
  AND fd.column_name IN
  (
      'RFDEIACB',
      'RFDALCCB',
      'RFDLCNCB',
      'RFDTYPCB',
      'RFDTCDCB',
      'RFDSUBCB'
  );


DELETE FROM lsar_meta.entity_relationship
WHERE
    (
        child_entity_code = 'CA'
        AND parent_entity_code = 'CA'
        AND constraint_name = 'ref_ca_referenced_task'
    )
 OR (
        child_entity_code = 'CB'
        AND parent_entity_code = 'CB'
        AND constraint_name = 'ref_cb_referenced_subtask'
    );

COMMIT;
