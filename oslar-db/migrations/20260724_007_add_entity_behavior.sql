BEGIN;

CREATE TABLE lsar_meta.entity_behavior (
  entity_behavior_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_behavior_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_code text NOT NULL,

  navigation_label text,
  navigation_order integer,
  show_in_navigation boolean NOT NULL DEFAULT true,

  default_form_code text,
  default_sort_column text,
  default_sort_direction text,
  default_page_size integer,

  lookup_display_columns jsonb,
  default_list_columns jsonb,
  default_search_columns jsonb,

  allow_create boolean NOT NULL DEFAULT false,
  allow_edit boolean NOT NULL DEFAULT false,
  allow_delete boolean NOT NULL DEFAULT false,
  allow_import boolean NOT NULL DEFAULT false,
  allow_export boolean NOT NULL DEFAULT true,

  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT entity_behavior_uid_uq
    UNIQUE (entity_behavior_uid),

  CONSTRAINT entity_behavior_entity_code_uq
    UNIQUE (entity_code),

  CONSTRAINT entity_behavior_entity_code_fkey
    FOREIGN KEY (entity_code)
    REFERENCES lsar_meta.entity(entity_code)
    ON DELETE CASCADE,

  CONSTRAINT entity_behavior_navigation_order_chk
    CHECK (
      navigation_order IS NULL
      OR navigation_order >= 0
    ),

  CONSTRAINT entity_behavior_sort_direction_chk
    CHECK (
      default_sort_direction IS NULL
      OR default_sort_direction IN ('asc', 'desc')
    ),

  CONSTRAINT entity_behavior_page_size_chk
    CHECK (
      default_page_size IS NULL
      OR default_page_size BETWEEN 1 AND 1000
    ),

  CONSTRAINT entity_behavior_lookup_columns_chk
    CHECK (
      lookup_display_columns IS NULL
      OR jsonb_typeof(lookup_display_columns) = 'array'
    ),

  CONSTRAINT entity_behavior_list_columns_chk
    CHECK (
      default_list_columns IS NULL
      OR jsonb_typeof(default_list_columns) = 'array'
    ),

  CONSTRAINT entity_behavior_search_columns_chk
    CHECK (
      default_search_columns IS NULL
      OR jsonb_typeof(default_search_columns) = 'array'
    )
);

COMMENT ON TABLE lsar_meta.entity_behavior IS
  'Default navigation, lookup, list and CRUD behaviour for an OSLAR entity.';

COMMENT ON COLUMN lsar_meta.entity_behavior.lookup_display_columns IS
  'Ordered JSON array of parent-entity columns displayed in generated lookup controls.';

COMMENT ON COLUMN lsar_meta.entity_behavior.default_list_columns IS
  'Ordered JSON array overriding compiler-generated list columns.';

COMMENT ON COLUMN lsar_meta.entity_behavior.default_search_columns IS
  'Ordered JSON array overriding compiler-generated search columns.';

CREATE INDEX entity_behavior_navigation_idx
  ON lsar_meta.entity_behavior (
    navigation_order,
    entity_code
  )
  WHERE active = true
    AND show_in_navigation = true;

COMMIT;
