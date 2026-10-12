BEGIN;

DO $$
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Wescam trial migration requires open_lsar';
    END IF;
END $$;

DO $$
BEGIN
    IF (SELECT count(*) FROM lsar_meta.entity
        WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF') AND profile_code = 'WESCAM_OPUS') <> 9 THEN
        RAISE EXCEPTION 'Apply Wescam 041 before 042';
    END IF;
    IF EXISTS (SELECT 1 FROM lsar_meta.entity_behavior WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF'))
       OR EXISTS (SELECT 1 FROM lsar_meta.form_definition WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF'))
       OR EXISTS (SELECT 1 FROM lsar_meta.field_behavior fb
                  JOIN lsar_meta.field_def fd USING (field_def_id)
                  WHERE fd.entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF')) THEN
        RAISE EXCEPTION 'Existing Wescam presentation; review before applying';
    END IF;
END $$;

-- Use the compiler-generated General section for every EAGLE column.
-- No manual form_definition/section layout is needed.
INSERT INTO lsar_meta.entity_behavior
    (entity_code, navigation_label, navigation_order, show_in_navigation,
     default_sort_column, default_sort_direction, default_page_size,
     lookup_display_columns, default_list_columns, default_search_columns,
     allow_create, allow_edit, allow_delete, allow_import, allow_export, active)
VALUES
('WESCAM_XA', 'Wescam End Item', 200, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","LCNSTRXA"]'::jsonb, '["EIACODXA","LCNSTRXA"]'::jsonb, '["EIACODXA","LCNSTRXA"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_XB', 'Wescam LCN', 210, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","LCNAMEXB"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","LCNAMEXB"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","LCNAMEXB"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_XC', 'Wescam System/UOC', 220, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","UOCSEIXC","PCCNUMXC","ITMDESXC"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","UOCSEIXC","PCCNUMXC","ITMDESXC"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","UOCSEIXC","PCCNUMXC","ITMDESXC"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_HA', 'Wescam Parts', 230, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","CAGECDXH","REFNUMHA","ITNAMEHA"]'::jsonb, '["EIACODXA","CAGECDXH","REFNUMHA","ITNAMEHA"]'::jsonb, '["EIACODXA","CAGECDXH","REFNUMHA","ITNAMEHA"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_HG', 'Wescam Part Application', 240, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","QTYASYHG"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","QTYASYHG"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","QTYASYHG"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_HO', 'Wescam Provisioning UOC', 250, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","LCNTYPXB","CAGECDHO","REFNUMHO","LSACONHO","ALTLCNHO","LCNSEIHO","ALCSEIHO"]'::jsonb, '["EIACODXA","LCNTYPXB","CAGECDHO","REFNUMHO","LSACONHO","ALTLCNHO","LCNSEIHO","ALCSEIHO"]'::jsonb, '["EIACODXA","LCNTYPXB","CAGECDHO","REFNUMHO","LSACONHO","ALTLCNHO","LCNSEIHO","ALCSEIHO"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_THA', 'Wescam Part Extension', 260, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","CAGECDXH","REFNUMHA","DESCRTHA"]'::jsonb, '["EIACODXA","CAGECDXH","REFNUMHA","DESCRTHA"]'::jsonb, '["EIACODXA","CAGECDXH","REFNUMHA","DESCRTHA"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_THG', 'Wescam Application Extension', 270, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","CSNUMTHG"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","CSNUMTHG"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA","CSNUMTHG"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE),
('WESCAM_XF', 'Wescam LCN UOC', 280, TRUE, 'EIACODXA', 'asc', 25, '["EIACODXA","LSACONXF","ALTLCNXF","LCNTYPXF","LCNSEIXF","ALCSEIXF","LTYSEIXF"]'::jsonb, '["EIACODXA","LSACONXF","ALTLCNXF","LCNTYPXF","LCNSEIXF","ALCSEIXF","LTYSEIXF"]'::jsonb, '["EIACODXA","LSACONXF","ALTLCNXF","LCNTYPXF","LCNSEIXF","ALCSEIXF","LTYSEIXF"]'::jsonb, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE);

-- Explicit lookup controls only; companion behavior is supplied by the compiler.
INSERT INTO lsar_meta.field_behavior
    (field_def_id, display_label, control_type, placeholder, help_text, active)
SELECT f.field_def_id, r.relationship_label, 'lookup',
       'Select ' || r.relationship_label,
       CASE
         WHEN r.constraint_name = 'fk_wescam_ho__xc'
           THEN 'Select an XC record for the chosen End Item and LCN Type.'
         WHEN r.constraint_name = 'fk_wescam_xf__xc'
           THEN 'Select an XC record for the chosen End Item; XF LTYSEIXF is independent of LCNTYPXF.'
         ELSE 'Select the parent record to populate the relationship fields.'
       END, TRUE
FROM lsar_meta.entity_relationship r
JOIN lsar_meta.field_def f
  ON f.entity_code = r.child_entity_code AND f.column_name = r.lookup_anchor_column
WHERE r.child_entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF') AND r.active;

COMMIT;
