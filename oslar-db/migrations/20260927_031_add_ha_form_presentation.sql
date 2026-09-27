BEGIN;

-- ============================================================================
-- HA generated form presentation.
--
-- HA = Parts Library
--
-- Primary identity:
--   EIACODXA  -> XA End Item
--   CAGECDXH  -> XH Vendor / CAGE
--   REFNUMHA  -> Part / Reference Number
--
-- Code-list fields remain text controls until normalized domain metadata is
-- available. Physical numeric and boolean fields use their native controls.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. HA entity behavior
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.entity_behavior
(
    entity_code,
    navigation_label,
    navigation_order,
    show_in_navigation,
    default_form_code,
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
    'HA',
    'Parts Library',
    70,
    TRUE,
    'default-edit',
    'REFNUMHA',
    'asc',
    25,
    '["REFNUMHA", "ITNAMEHA", "CAGECDXH"]'::jsonb,
    '["EIACODXA", "CAGECDXH", "REFNUMHA", "ITNAMEHA", "ITMDESHA"]'::jsonb,
    '["REFNUMHA", "ITNAMEHA", "ITMDESHA", "CAGECDXH"]'::jsonb,
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
    default_form_code      = EXCLUDED.default_form_code,
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


-- ---------------------------------------------------------------------------
-- 2. HA form definition
-- ---------------------------------------------------------------------------

INSERT INTO lsar_meta.form_definition
(
    entity_code,
    form_code,
    form_name,
    form_type,
    description,
    active
)
VALUES
(
    'HA',
    'default-edit',
    'HA Default Edit Form',
    'edit',
    'Metadata-driven Parts Library form.',
    TRUE
)
ON CONFLICT (entity_code, form_code)
DO UPDATE SET
    form_name   = EXCLUDED.form_name,
    form_type   = EXCLUDED.form_type,
    description = EXCLUDED.description,
    active      = TRUE,
    updated_at  = now();


-- ---------------------------------------------------------------------------
-- 3. HA form sections
-- ---------------------------------------------------------------------------

WITH ha_form AS
(
    SELECT form_definition_id
    FROM lsar_meta.form_definition
    WHERE entity_code = 'HA'
      AND form_code = 'default-edit'
)
INSERT INTO lsar_meta.form_section
(
    form_definition_id,
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed,
    active
)
SELECT
    ha_form.form_definition_id,
    x.section_code,
    x.section_name,
    x.description,
    x.display_order,
    x.column_count,
    x.collapsible,
    x.initially_collapsed,
    TRUE
FROM ha_form
CROSS JOIN
(
    VALUES
        ('identity',       'Part Identity',
         'End Item, vendor/CAGE and part identification.',
         10, 2, FALSE, FALSE),

        ('classification', 'Classification / Units',
         'Item classification, management and units of issue or measure.',
         20, 2, FALSE, FALSE),

        ('acquisition',    'Acquisition / Documentation',
         'Acquisition, documentation and lead-time information.',
         30, 2, TRUE, TRUE),

        ('nsn',            'NSN / Supply',
         'National Stock Number and supply classification information.',
         40, 2, TRUE, TRUE),

        ('lists',          'Provisioning Lists',
         'Provisioning and support-list applicability indicators.',
         50, 2, TRUE, TRUE),

        ('hazardous',      'Hazardous / Security',
         'Hazardous material, waste, demilitarization and security information.',
         60, 2, TRUE, TRUE),

        ('physical',       'Material / Physical',
         'Material, weight, dimensions and physical characteristics.',
         70, 2, TRUE, TRUE),

        ('maintenance',    'Maintenance / Shelf Life',
         'Shelf life, maintenance and special material information.',
         80, 2, TRUE, TRUE),

        ('administrative', 'Other / Administrative',
         'Criticality, reference-number and other administrative information.',
         90, 2, TRUE, TRUE)
) AS x
(
    section_code,
    section_name,
    description,
    display_order,
    column_count,
    collapsible,
    initially_collapsed
)
ON CONFLICT (form_definition_id, section_code)
DO UPDATE SET
    section_name        = EXCLUDED.section_name,
    description         = EXCLUDED.description,
    display_order       = EXCLUDED.display_order,
    column_count        = EXCLUDED.column_count,
    collapsible         = EXCLUDED.collapsible,
    initially_collapsed = EXCLUDED.initially_collapsed,
    active              = TRUE,
    updated_at          = now();


-- ---------------------------------------------------------------------------
-- 4. HA field behavior
-- ---------------------------------------------------------------------------

WITH ha_sections AS
(
    SELECT
        fs.form_section_id,
        fs.section_code
    FROM lsar_meta.form_section fs
    JOIN lsar_meta.form_definition f
      ON f.form_definition_id = fs.form_definition_id
    WHERE f.entity_code = 'HA'
      AND f.form_code = 'default-edit'
)
INSERT INTO lsar_meta.field_behavior
(
    field_def_id,
    display_label,
    display_order,
    control_type,
    required,
    read_only,
    hidden,
    searchable,
    sortable,
    filterable,
    placeholder,
    help_text,
    default_width,
    form_section_id,
    column_span,
    active
)
SELECT
    fd.field_def_id,
    x.display_label,
    x.display_order,
    x.control_type,
    x.required,
    FALSE,
    FALSE,
    x.searchable,
    TRUE,
    TRUE,
    NULL,
    x.help_text,
    x.default_width,
    hs.form_section_id,
    x.column_span,
    TRUE
FROM
(
    VALUES

        -- ================================================================
        -- Part Identity
        -- ================================================================
        ('EIACODXA', 'End Item', 10, 'lookup',
         TRUE, TRUE,
         'Select the XA End Item to which this part record belongs.',
         20, 'identity', 1),

        ('CAGECDXH', 'Vendor / CAGE', 20, 'lookup',
         TRUE, TRUE,
         'Select the XH Commercial and Government Entity for this part.',
         20, 'identity', 1),

        ('REFNUMHA', 'Part / Reference Number', 30, 'text',
         TRUE, TRUE,
         'Reference Number forms part of the HA primary key.',
         32, 'identity', 1),

        ('ITNAMEHA', 'Item Name', 40, 'text',
         FALSE, TRUE,
         NULL,
         24, 'identity', 1),

        ('INAMECHA', 'Item Name Code', 50, 'text',
         FALSE, TRUE,
         NULL,
         12, 'identity', 1),

        ('ITMDESHA', 'Item Description', 60, 'textarea',
         FALSE, TRUE,
         NULL,
         50, 'identity', 2),


        -- ================================================================
        -- Classification / Units
        -- ================================================================
        ('ICLSUPHA', 'Item Class of Supply', 10, 'text',
         FALSE, TRUE, NULL,
         14, 'classification', 1),

        ('ISUBCLHA', 'Item Subclass', 20, 'text',
         FALSE, TRUE, NULL,
         10, 'classification', 1),

        ('ITMMGCHA', 'Item Management Code', 30, 'text',
         FALSE, TRUE, NULL,
         12, 'classification', 1),

        ('UNITISHA', 'Unit of Issue', 40, 'text',
         FALSE, TRUE, NULL,
         12, 'classification', 1),

        ('UNITMSHA', 'Unit of Measure', 50, 'text',
         FALSE, TRUE, NULL,
         12, 'classification', 1),

        ('UICONVHA', 'Unit of Issue Conversion Factor', 60, 'decimal',
         FALSE, FALSE, NULL,
         18, 'classification', 1),

        ('LINNUMHA', 'Line Item Number', 70, 'text',
         FALSE, TRUE, NULL,
         14, 'classification', 1),

        ('LNERUMHA', 'Linear Unit of Measure', 80, 'text',
         FALSE, TRUE, NULL,
         14, 'classification', 1),


        -- ================================================================
        -- Acquisition / Documentation
        -- ================================================================
        ('ACQMETHA', 'Acquisition Method Code', 10, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('AMSUFCHA', 'Acquisition Method Suffix Code', 20, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('ADPEQPHA', 'Automatic Data Processing Equipment Code', 30, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('CTICODHA', 'Contractor Technical Information Code', 40, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('DLSCRCHA', 'DLIS Screening Requirement Code', 50, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('DOCAVCHA', 'Document Availability Code', 60, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('DOCIDCHA', 'Document Identifier Code', 70, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('PRDLDTHA', 'Production Lead Time', 80, 'number',
         FALSE, FALSE, NULL,
         14, 'acquisition', 1),

        ('MTLEADHA', 'Material Lead Time', 90, 'number',
         FALSE, FALSE, NULL,
         14, 'acquisition', 1),

        ('PPSLSTHA', 'Program Parts Selection List', 100, 'text',
         FALSE, TRUE, NULL,
         14, 'acquisition', 1),

        ('SCHDBAHA', 'Schedule B Export Code', 110, 'text',
         FALSE, TRUE, NULL,
         18, 'acquisition', 1),


        -- ================================================================
        -- NSN / Supply
        -- ================================================================
        ('ACTNSNHA', 'NSN Activity Code', 10, 'text',
         FALSE, TRUE, NULL,
         14, 'nsn', 1),

        ('COGNSNHA', 'NSN Cognizance Code', 20, 'text',
         FALSE, TRUE, NULL,
         14, 'nsn', 1),

        ('FSCNSNHA', 'Federal Supply Classification', 30, 'number',
         FALSE, FALSE, NULL,
         14, 'nsn', 1),

        ('MATNSNHA', 'NSN Materiel Control Code', 40, 'text',
         FALSE, TRUE, NULL,
         14, 'nsn', 1),

        ('NIINSNHA', 'National Item Identification Number', 50, 'text',
         FALSE, TRUE, NULL,
         18, 'nsn', 1),

        ('SMMNSNHA', 'NSN Special Materiel Identification Code', 60, 'text',
         FALSE, TRUE, NULL,
         14, 'nsn', 1),


        -- ================================================================
        -- Provisioning Lists
        -- ================================================================
        ('AAPLCCHA', 'Authorization Stock List', 10, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('EEPLCCHA', 'Common and Bulk Item List', 20, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('GOVFURHA', 'Government Furnished Item List', 30, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('HHPLCCHA', 'Installation and Checkout Item List', 40, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('GGPLCCHA', 'Interim Released Item List', 50, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('BBPLCCHA', 'Interim Support Item List', 60, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('CCPLCCHA', 'Long Lead Time Item List', 70, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('LLPLCCHA', 'Prescribed Load List Item List', 80, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('KKPLCCHA', 'Recommended Buy List Item List', 90, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('RILPTDHG', 'Repairable Item List', 100, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('MMPLCCHA', 'System Support Package Component List', 110, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),

        ('DDPLCCHA', 'Tools and Test Equipment List', 120, 'text',
         FALSE, TRUE, NULL,
         14, 'lists', 1),


        -- ================================================================
        -- Hazardous / Security
        -- ================================================================
        ('HAZCODHA', 'Hazardous Code', 10, 'boolean',
         FALSE, FALSE, NULL,
         14, 'hazardous', 1),

        ('HMSCOSHA', 'Hazardous Materials Storage Cost', 20, 'number',
         FALSE, FALSE, NULL,
         18, 'hazardous', 1),

        ('HWACCCHA', 'Hazardous Waste Cost Currency Code', 30, 'text',
         FALSE, TRUE, NULL,
         14, 'hazardous', 1),

        ('HWDCOSHA', 'Hazardous Waste Disposal Cost', 40, 'number',
         FALSE, FALSE, NULL,
         18, 'hazardous', 1),

        ('HWSCOSHA', 'Hazardous Waste Storage Cost', 50, 'number',
         FALSE, FALSE, NULL,
         18, 'hazardous', 1),

        ('DEMILIHA', 'Demilitarization Code', 60, 'text',
         FALSE, TRUE, NULL,
         14, 'hazardous', 1),

        ('PHYSECHA', 'Physical Security Pilferage Code', 70, 'text',
         FALSE, TRUE, NULL,
         14, 'hazardous', 1),

        ('PMICODHA', 'Precious Metal Indicator Code', 80, 'text',
         FALSE, TRUE, NULL,
         14, 'hazardous', 1),


        -- ================================================================
        -- Material / Physical
        -- ================================================================
        ('MATERLHA', 'Material', 10, 'textarea',
         FALSE, TRUE, NULL,
         50, 'physical', 2),

        ('MTLWGTHA', 'Material Weight', 20, 'decimal',
         FALSE, FALSE, NULL,
         16, 'physical', 1),

        ('CRCBTYHA', 'Circuit Breaker Type', 30, 'text',
         FALSE, TRUE, NULL,
         30, 'physical', 1),

        ('UHEIGHHA', 'Unit Size Height', 40, 'decimal',
         FALSE, FALSE, NULL,
         14, 'physical', 1),

        ('ULENGTHA', 'Unit Size Length', 50, 'decimal',
         FALSE, FALSE, NULL,
         14, 'physical', 1),

        ('UWIDTHHA', 'Unit Size Width', 60, 'decimal',
         FALSE, FALSE, NULL,
         14, 'physical', 1),

        ('UWEIGHHA', 'Unit Weight', 70, 'decimal',
         FALSE, FALSE, NULL,
         14, 'physical', 1),


        -- ================================================================
        -- Maintenance / Shelf Life
        -- ================================================================
        ('SHLIFEHA', 'Shelf Life', 10, 'text',
         FALSE, TRUE, NULL,
         14, 'maintenance', 1),

        ('SLACTNHA', 'Shelf Life Action Code', 20, 'text',
         FALSE, TRUE, NULL,
         14, 'maintenance', 1),

        ('SAIPCDHA', 'Spares Acquisition Integrated With Production', 30, 'boolean',
         FALSE, FALSE, NULL,
         18, 'maintenance', 1),

        ('SMAINCHA', 'Special Maintenance Item Code', 40, 'text',
         FALSE, TRUE, NULL,
         14, 'maintenance', 1),

        ('SPMACCHA', 'Special Material Content Code', 50, 'text',
         FALSE, TRUE, NULL,
         14, 'maintenance', 1),


        -- ================================================================
        -- Other / Administrative
        -- ================================================================
        ('CRITITHA', 'Critical Item Code', 10, 'text',
         FALSE, TRUE, NULL,
         18, 'administrative', 1),

        ('CRITCDHA', 'Criticality Code', 20, 'text',
         FALSE, TRUE, NULL,
         14, 'administrative', 1),

        ('INDMATHA', 'Industrial Materials Analysis of Capacity', 30, 'text',
         FALSE, TRUE, NULL,
         24, 'administrative', 1),

        ('REFNCCHA', 'Reference Number Category Code', 40, 'text',
         FALSE, TRUE, NULL,
         14, 'administrative', 1),

        ('REFNVCHA', 'Reference Number Variation Code', 50, 'text',
         FALSE, TRUE, NULL,
         14, 'administrative', 1)

) AS x
(
    column_name,
    display_label,
    display_order,
    control_type,
    required,
    searchable,
    help_text,
    default_width,
    section_code,
    column_span
)
JOIN lsar_meta.field_def fd
  ON fd.entity_code = 'HA'
 AND fd.column_name = x.column_name
 AND fd.deprecated = FALSE
JOIN ha_sections hs
  ON hs.section_code = x.section_code
ON CONFLICT (field_def_id)
DO UPDATE SET
    display_label   = EXCLUDED.display_label,
    display_order   = EXCLUDED.display_order,
    control_type    = EXCLUDED.control_type,
    required        = EXCLUDED.required,
    read_only       = EXCLUDED.read_only,
    hidden          = EXCLUDED.hidden,
    searchable      = EXCLUDED.searchable,
    sortable        = EXCLUDED.sortable,
    filterable      = EXCLUDED.filterable,
    placeholder     = EXCLUDED.placeholder,
    help_text       = EXCLUDED.help_text,
    default_width   = EXCLUDED.default_width,
    form_section_id = EXCLUDED.form_section_id,
    column_span     = EXCLUDED.column_span,
    active          = TRUE,
    updated_at      = now();

COMMIT;
