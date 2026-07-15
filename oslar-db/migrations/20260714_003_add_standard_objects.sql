BEGIN;

CREATE TABLE lsar_meta.standard_object (
  standard_object_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  standard_object_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  standard_version_id bigint NOT NULL,
  parent_standard_object_id bigint,
  object_type text NOT NULL,
  source_code text,
  source_name text NOT NULL,
  definition text,
  source_reference text,
  ordinal_pos integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT standard_object_uid_uq
    UNIQUE (standard_object_uid),

  CONSTRAINT standard_object_version_type_code_uq
    UNIQUE NULLS NOT DISTINCT (
      standard_version_id,
      object_type,
      source_code
    ),

  CONSTRAINT standard_object_standard_version_id_fkey
    FOREIGN KEY (standard_version_id)
    REFERENCES lsar_meta.standard_version(standard_version_id)
    ON DELETE CASCADE,

  CONSTRAINT standard_object_parent_fkey
    FOREIGN KEY (parent_standard_object_id)
    REFERENCES lsar_meta.standard_object(standard_object_id)
    ON DELETE CASCADE,

  CONSTRAINT standard_object_type_chk
    CHECK (
      object_type IN (
        'entity',
        'attribute',
        'table',
        'field',
        'ded',
        'relationship',
        'rule',
        'concept',
        'other'
      )
    )
);

COMMENT ON TABLE lsar_meta.standard_object IS
  'Version-specific entities, fields, attributes, DEDs, rules and other objects defined by a standard.';

CREATE INDEX standard_object_standard_version_id_idx
  ON lsar_meta.standard_object (standard_version_id);

CREATE INDEX standard_object_parent_id_idx
  ON lsar_meta.standard_object (parent_standard_object_id);

CREATE INDEX standard_object_source_name_idx
  ON lsar_meta.standard_object (source_name);

COMMIT;
