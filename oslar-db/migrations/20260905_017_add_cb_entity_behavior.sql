BEGIN;

INSERT INTO lsar_meta.entity_behavior
(
    entity_code,
    navigation_label,
    navigation_order,
    show_in_navigation,
    default_sort_column,
    default_sort_direction,
    default_page_size,
    lookup_display_columns,
    default_list_columns,
    default_search_columns,
    allow_create,
    allow_edit,
    allow_delete,
    allow_import,
    allow_export,
    active
)
VALUES
(
    'CB',
    'Subtasks',
    40,
    TRUE,
    'SUBNUMCB',
    'asc',
    25,
    '["SUBNUMCB", "SUBTIDCB", "SUBTDECB"]'::jsonb,
    '["EIACODXA", "LSACONXB", "ALTLCNXB", "LCNTYPXB", "TASKCDCA", "SUBNUMCB", "SUBTIDCB", "SUBTDECB"]'::jsonb,
    '["TASKCDCA", "SUBTIDCB", "SUBTDECB"]'::jsonb,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    TRUE
)
ON CONFLICT (entity_code)
DO UPDATE SET
    navigation_label       = EXCLUDED.navigation_label,
    navigation_order       = EXCLUDED.navigation_order,
    show_in_navigation     = EXCLUDED.show_in_navigation,
    default_sort_column    = EXCLUDED.default_sort_column,
    default_sort_direction = EXCLUDED.default_sort_direction,
    default_page_size      = EXCLUDED.default_page_size,
    lookup_display_columns = EXCLUDED.lookup_display_columns,
    default_list_columns   = EXCLUDED.default_list_columns,
    default_search_columns = EXCLUDED.default_search_columns,
    allow_create           = EXCLUDED.allow_create,
    allow_edit             = EXCLUDED.allow_edit,
    allow_delete           = EXCLUDED.allow_delete,
    allow_import           = EXCLUDED.allow_import,
    allow_export           = EXCLUDED.allow_export,
    active                 = EXCLUDED.active,
    updated_at             = now();

-- Improve CA presentation when CA is used as a parent lookup.
-- The complete five-column CA key is still carried internally.
UPDATE lsar_meta.entity_behavior
SET
    lookup_display_columns = '["TASKCDCA", "TASKIDCA"]'::jsonb,
    default_search_columns = '["TASKCDCA", "TASKIDCA"]'::jsonb,
    updated_at = now()
WHERE entity_code = 'CA';

COMMIT;
