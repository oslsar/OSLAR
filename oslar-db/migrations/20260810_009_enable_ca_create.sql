BEGIN;

INSERT INTO lsar_meta.entity_behavior (
  entity_code,
  navigation_label,
  navigation_order,
  show_in_navigation,
  default_sort_column,
  default_sort_direction,
  default_page_size,
  allow_create,
  allow_edit,
  allow_delete,
  allow_import,
  allow_export,
  active
)
VALUES (
  'CA',
  'Tasks',
  30,
  true,
  'TASKCDCA',
  'asc',
  25,
  true,
  false,
  false,
  false,
  true,
  true
)
ON CONFLICT (entity_code)
DO UPDATE SET
  navigation_label = EXCLUDED.navigation_label,
  navigation_order = EXCLUDED.navigation_order,
  show_in_navigation = EXCLUDED.show_in_navigation,
  default_sort_column = EXCLUDED.default_sort_column,
  default_sort_direction = EXCLUDED.default_sort_direction,
  default_page_size = EXCLUDED.default_page_size,
  allow_create = EXCLUDED.allow_create,
  allow_edit = EXCLUDED.allow_edit,
  allow_delete = EXCLUDED.allow_delete,
  allow_import = EXCLUDED.allow_import,
  allow_export = EXCLUDED.allow_export,
  active = EXCLUDED.active,
  updated_at = now();

COMMIT;
