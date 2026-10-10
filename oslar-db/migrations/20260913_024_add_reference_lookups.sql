BEGIN;

-- ============================================================
-- CA -> CA semantic reference lookup
-- Referenced Task
-- ============================================================

INSERT INTO lsar_meta.entity_relationship
(
    child_entity_code,
    parent_entity_code,
    constraint_name,
    relationship_type,
    relationship_label,
    fk_columns,
    pk_columns,
    active,
    comments
)
VALUES
(
    'CA',
    'CA',
    'ref_ca_referenced_task',
    'reference_lookup',
    'Referenced Task',
    '[
      "REFEIACA",
      "REFALCCA",
      "REFLCNCA",
      "REFTYPCA",
      "REFTSKCA"
    ]'::jsonb,
    '[
      "EIACODXA",
      "ALTLCNXB",
      "LSACONXB",
      "LCNTYPXB",
      "TASKCDCA"
    ]'::jsonb,
    true,
    'Semantic lookup only. Not enforced as a physical foreign key.'
)
ON CONFLICT
(
    child_entity_code,
    parent_entity_code,
    constraint_name
)
DO UPDATE SET
    relationship_type = EXCLUDED.relationship_type,
    relationship_label = EXCLUDED.relationship_label,
    fk_columns = EXCLUDED.fk_columns,
    pk_columns = EXCLUDED.pk_columns,
    active = true,
    comments = EXCLUDED.comments;


-- ============================================================
-- CB -> CB semantic reference lookup
-- Referenced Subtask
-- ============================================================

INSERT INTO lsar_meta.entity_relationship
(
    child_entity_code,
    parent_entity_code,
    constraint_name,
    relationship_type,
    relationship_label,
    fk_columns,
    pk_columns,
    active,
    comments
)
VALUES
(
    'CB',
    'CB',
    'ref_cb_referenced_subtask',
    'reference_lookup',
    'Referenced Subtask',
    '[
      "RFDEIACB",
      "RFDALCCB",
      "RFDLCNCB",
      "RFDTYPCB",
      "RFDTCDCB",
      "RFDSUBCB"
    ]'::jsonb,
    '[
      "EIACODXA",
      "ALTLCNXB",
      "LSACONXB",
      "LCNTYPXB",
      "TASKCDCA",
      "SUBNUMCB"
    ]'::jsonb,
    true,
    'Semantic lookup only. Not enforced as a physical foreign key.'
)
ON CONFLICT
(
    child_entity_code,
    parent_entity_code,
    constraint_name
)
DO UPDATE SET
    relationship_type = EXCLUDED.relationship_type,
    relationship_label = EXCLUDED.relationship_label,
    fk_columns = EXCLUDED.fk_columns,
    pk_columns = EXCLUDED.pk_columns,
    active = true,
    comments = EXCLUDED.comments;


-- ============================================================
-- CA form: make first referenced-task field the lookup anchor.
-- Companion fields remain populated by the composite selector.
-- ============================================================

UPDATE lsar_meta.field_behavior fb
SET
    control_type = CASE
        WHEN fd.column_name = 'REFEIACA' THEN 'lookup'
        ELSE 'text'
    END,
    read_only = CASE
        WHEN fd.column_name = 'REFEIACA' THEN false
        ELSE true
    END,
    help_text = CASE
        WHEN fd.column_name = 'REFEIACA'
            THEN 'Select a referenced task.'
        ELSE 'Supplied by Referenced Task selection.'
    END,
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


-- ============================================================
-- CB form: make first referenced-subtask field the lookup anchor.
-- Companion fields remain populated by the composite selector.
-- ============================================================

UPDATE lsar_meta.field_behavior fb
SET
    control_type = CASE
        WHEN fd.column_name = 'RFDEIACB' THEN 'lookup'
        WHEN fd.column_name = 'RFDSUBCB' THEN 'number'
        ELSE 'text'
    END,
    read_only = CASE
        WHEN fd.column_name = 'RFDEIACB' THEN false
        ELSE true
    END,
    help_text = CASE
        WHEN fd.column_name = 'RFDEIACB'
            THEN 'Select a referenced subtask.'
        ELSE 'Supplied by Referenced Subtask selection.'
    END,
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

COMMIT;
