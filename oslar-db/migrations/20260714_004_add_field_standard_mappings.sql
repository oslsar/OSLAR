BEGIN;

CREATE TABLE lsar_meta.field_standard_mapping (
  mapping_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mapping_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  field_def_id bigint NOT NULL,
  standard_object_id bigint NOT NULL,
  mapping_type text NOT NULL DEFAULT 'direct',
  mapping_status text NOT NULL DEFAULT 'draft',
  transformation_rule text,
  confidence numeric(5,4),
  verified_by text,
  verified_at timestamptz,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT field_standard_mapping_uid_uq
    UNIQUE (mapping_uid),

  CONSTRAINT field_standard_mapping_field_object_uq
    UNIQUE (field_def_id, standard_object_id),

  CONSTRAINT field_standard_mapping_field_def_id_fkey
    FOREIGN KEY (field_def_id)
    REFERENCES lsar_meta.field_def(field_def_id)
    ON DELETE CASCADE,

  CONSTRAINT field_standard_mapping_standard_object_id_fkey
    FOREIGN KEY (standard_object_id)
    REFERENCES lsar_meta.standard_object(standard_object_id)
    ON DELETE CASCADE,

  CONSTRAINT field_standard_mapping_type_chk
    CHECK (
      mapping_type IN (
        'direct',
        'equivalent',
        'derived',
        'split',
        'combined',
        'partial',
        'no_equivalent',
        'extension'
      )
    ),

  CONSTRAINT field_standard_mapping_status_chk
    CHECK (
      mapping_status IN (
        'draft',
        'proposed',
        'verified',
        'deprecated',
        'rejected'
      )
    ),

  CONSTRAINT field_standard_mapping_confidence_chk
    CHECK (
      confidence IS NULL
      OR confidence BETWEEN 0 AND 1
    ),

  CONSTRAINT field_standard_mapping_verification_chk
    CHECK (
      mapping_status <> 'verified'
      OR (
        verified_by IS NOT NULL
        AND verified_at IS NOT NULL
      )
    )
);

COMMENT ON TABLE lsar_meta.field_standard_mapping IS
  'Traceable mappings between OSLAR field definitions and versioned standard objects.';

CREATE INDEX field_standard_mapping_field_def_id_idx
  ON lsar_meta.field_standard_mapping (field_def_id);

CREATE INDEX field_standard_mapping_standard_object_id_idx
  ON lsar_meta.field_standard_mapping (standard_object_id);

CREATE INDEX field_standard_mapping_status_idx
  ON lsar_meta.field_standard_mapping (mapping_status)
  WHERE active = true;

COMMIT;
