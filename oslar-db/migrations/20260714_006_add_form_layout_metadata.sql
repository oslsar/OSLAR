BEGIN;

CREATE TABLE lsar_meta.form_definition (
  form_definition_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  form_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_code text NOT NULL,
  form_code text NOT NULL,
  form_name text NOT NULL,
  form_type text NOT NULL DEFAULT 'edit',
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT form_definition_uid_uq
    UNIQUE (form_uid),

  CONSTRAINT form_definition_entity_code_form_code_uq
    UNIQUE (entity_code, form_code),

  CONSTRAINT form_definition_entity_code_fkey
    FOREIGN KEY (entity_code)
    REFERENCES lsar_meta.entity(entity_code)
    ON DELETE CASCADE,

  CONSTRAINT form_definition_type_chk
    CHECK (
      form_type IN (
        'create',
        'edit',
        'view',
        'search'
      )
    )
);

COMMENT ON TABLE lsar_meta.form_definition IS
  'Metadata definitions for generated OSLAR forms associated with an entity.';


CREATE TABLE lsar_meta.form_section (
  form_section_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  form_section_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  form_definition_id bigint NOT NULL,
  section_code text NOT NULL,
  section_name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  column_count integer NOT NULL DEFAULT 2,
  collapsible boolean NOT NULL DEFAULT false,
  initially_collapsed boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT form_section_uid_uq
    UNIQUE (form_section_uid),

  CONSTRAINT form_section_form_code_uq
    UNIQUE (form_definition_id, section_code),

  CONSTRAINT form_section_form_definition_id_fkey
    FOREIGN KEY (form_definition_id)
    REFERENCES lsar_meta.form_definition(form_definition_id)
    ON DELETE CASCADE,

  CONSTRAINT form_section_display_order_chk
    CHECK (display_order >= 0),

  CONSTRAINT form_section_column_count_chk
    CHECK (column_count BETWEEN 1 AND 4),

  CONSTRAINT form_section_collapsed_chk
    CHECK (
      initially_collapsed = false
      OR collapsible = true
    )
);

COMMENT ON TABLE lsar_meta.form_section IS
  'Ordered sections within a metadata-generated OSLAR form.';


ALTER TABLE lsar_meta.field_behavior
  ADD COLUMN form_section_id bigint,
  ADD COLUMN column_span integer;

ALTER TABLE lsar_meta.field_behavior
  ADD CONSTRAINT field_behavior_form_section_id_fkey
    FOREIGN KEY (form_section_id)
    REFERENCES lsar_meta.form_section(form_section_id)
    ON DELETE SET NULL;

ALTER TABLE lsar_meta.field_behavior
  ADD CONSTRAINT field_behavior_column_span_chk
    CHECK (
      column_span IS NULL
      OR column_span BETWEEN 1 AND 4
    );

CREATE INDEX form_definition_entity_code_idx
  ON lsar_meta.form_definition (entity_code)
  WHERE active = true;

CREATE INDEX form_section_form_definition_id_idx
  ON lsar_meta.form_section (form_definition_id)
  WHERE active = true;

CREATE INDEX field_behavior_form_section_id_idx
  ON lsar_meta.field_behavior (form_section_id)
  WHERE active = true
    AND form_section_id IS NOT NULL;

COMMIT;
