BEGIN;

CREATE TABLE lsar_meta.field_behavior (
  field_behavior_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  field_behavior_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  field_def_id bigint NOT NULL,

  display_label text,
  display_order integer,
  control_type text,

  required boolean,
  read_only boolean,
  hidden boolean NOT NULL DEFAULT false,
  searchable boolean,
  sortable boolean,
  filterable boolean,

  placeholder text,
  help_text text,
  default_width integer,

  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT field_behavior_uid_uq
    UNIQUE (field_behavior_uid),

  CONSTRAINT field_behavior_field_def_uq
    UNIQUE (field_def_id),

  CONSTRAINT field_behavior_field_def_id_fkey
    FOREIGN KEY (field_def_id)
    REFERENCES lsar_meta.field_def(field_def_id)
    ON DELETE CASCADE,

  CONSTRAINT field_behavior_control_type_chk
    CHECK (
      control_type IS NULL
      OR control_type IN (
        'text',
        'number',
        'decimal',
        'boolean',
        'date',
        'datetime',
        'textarea',
        'select',
        'lookup'
      )
    ),

  CONSTRAINT field_behavior_display_order_chk
    CHECK (
      display_order IS NULL
      OR display_order >= 0
    ),

  CONSTRAINT field_behavior_default_width_chk
    CHECK (
      default_width IS NULL
      OR default_width BETWEEN 1 AND 200
    )
);

COMMENT ON TABLE lsar_meta.field_behavior IS
  'Default GUI and interaction behaviour for an OSLAR field definition.';

COMMENT ON COLUMN lsar_meta.field_behavior.required IS
  'NULL means infer from field metadata; true or false explicitly overrides inference.';

COMMENT ON COLUMN lsar_meta.field_behavior.read_only IS
  'NULL means infer from field metadata; true or false explicitly overrides inference.';

COMMENT ON COLUMN lsar_meta.field_behavior.searchable IS
  'NULL means infer from format and key metadata.';

COMMENT ON COLUMN lsar_meta.field_behavior.sortable IS
  'NULL means use the compiler default.';

COMMENT ON COLUMN lsar_meta.field_behavior.filterable IS
  'NULL means use the compiler default.';

CREATE INDEX field_behavior_active_idx
  ON lsar_meta.field_behavior (active)
  WHERE active = true;

CREATE INDEX field_behavior_display_order_idx
  ON lsar_meta.field_behavior (display_order)
  WHERE active = true
    AND hidden = false;

COMMIT;
