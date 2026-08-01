import { pool } from "@/lib/db";
import type {
  CompilerField,
  CompilerRelationship,
} from "@/lib/compiler/types";

type EntityRow = {
  entity_code: string;
  entity_uid: string;
  entity_name: string | null;
  include_entity: boolean;
  profile_code: string | null;
};

type PhysicalTableRow = {
  schema_name: string;
  table_name: string;
  estimated_rows: string | number | null;
};

type RelatedEntityBehaviorRow = {
  entity_code: string;
  lookup_display_columns: string[] | null;
};

export async function getEntityMetadata(entityCode: string) {
  const normalizedCode = entityCode.trim().toUpperCase();

  if (!/^[A-Z0-9_]{1,30}$/.test(normalizedCode)) {
    throw new Error("Invalid entity code");
  }

  const entityResult = await pool.query<EntityRow>(
    `
      SELECT
        entity_code,
        entity_uid::text,
        entity_name,
        include_entity,
        profile_code
      FROM lsar_meta.entity
      WHERE upper(entity_code) = $1
      LIMIT 1
    `,
    [normalizedCode]
  );

  const entity = entityResult.rows[0];

  if (!entity) {
    return null;
  }

  const fieldsResult = await pool.query(
    `
      SELECT
        f.field_def_id::text,
        f.field_uid::text,
        f.column_name,
        f.ordinal_pos,
        coalesce(
          nullif(f.element_name, ''),
          nullif(f.geia_short_name, ''),
          f.column_name
        ) AS display_name,
        f.format_spec,
        f.is_key,
        f.is_foreign,
        f.is_mandatory,
        f.include_element,
        f.deprecated,
        f.ded,
        f.geia_short_name,
        f.mil_1388_field,
        f.def_std_00_60,
        f.s3000l,
        b.display_label,
        b.display_order,
        b.control_type,
        b.required AS behavior_required,
        b.read_only AS behavior_read_only,
        coalesce(b.hidden, false) AS behavior_hidden,
        b.searchable AS behavior_searchable,
        b.sortable AS behavior_sortable,
        b.filterable AS behavior_filterable,
        b.placeholder,
        b.help_text,
        b.default_width,
        b.form_section_id::text AS behavior_form_section_id,
        b.column_span,
        count(m.mapping_id)::integer AS normalized_mapping_count
      FROM lsar_meta.field_def f
      LEFT JOIN lsar_meta.field_standard_mapping m
        ON m.field_def_id = f.field_def_id
       AND m.active = true
      LEFT JOIN lsar_meta.field_behavior b
        ON b.field_def_id = f.field_def_id
       AND b.active = true
      WHERE f.entity_code = $1
      GROUP BY
        f.field_def_id,
        f.field_uid,
        f.column_name,
        f.ordinal_pos,
        f.element_name,
        f.geia_short_name,
        f.format_spec,
        f.is_key,
        f.is_foreign,
        f.is_mandatory,
        f.include_element,
        f.deprecated,
        f.ded,
        f.mil_1388_field,
        f.def_std_00_60,
        f.s3000l,
        b.display_label,
        b.display_order,
        b.control_type,
        b.required,
        b.read_only,
        b.hidden,
        b.searchable,
        b.sortable,
        b.filterable,
        b.placeholder,
        b.help_text,
        b.default_width,
        b.form_section_id,
        b.column_span
      ORDER BY coalesce(f.ordinal_pos, 999999), f.column_name
    `,
    [entity.entity_code]
  );

  const fields: CompilerField[] = fieldsResult.rows.map((row) => ({
    fieldDefId: row.field_def_id,
    fieldUid: row.field_uid,
    columnName: row.column_name,
    ordinalPosition: row.ordinal_pos,
    displayName: row.display_name,
    formatSpec: row.format_spec,
    isKey: row.is_key,
    isForeign: row.is_foreign,
    isMandatory: row.is_mandatory,
    included: row.include_element,
    deprecated: row.deprecated,
    behavior: {
      displayLabel: row.display_label,
      displayOrder: row.display_order,
      controlType: row.control_type,
      required: row.behavior_required,
      readOnly: row.behavior_read_only,
      hidden: row.behavior_hidden,
      searchable: row.behavior_searchable,
      sortable: row.behavior_sortable,
      filterable: row.behavior_filterable,
      placeholder: row.placeholder,
      helpText: row.help_text,
      defaultWidth: row.default_width,
      formSectionId: row.behavior_form_section_id,
      columnSpan: row.column_span,
    },
    standards: {
      ded: row.ded,
      geiaShortName: row.geia_short_name,
      mil1388Field: row.mil_1388_field,
      defStan0060: row.def_std_00_60,
      s3000l: row.s3000l,
      normalizedMappings: row.normalized_mapping_count,
    },
  }));

  const formResult = await pool.query(
    `
      SELECT
        fd.form_code,
        fd.form_name,
        fd.form_type,
        fd.description AS form_description,
        fs.form_section_id::text,
        fs.section_code,
        fs.section_name,
        fs.description AS section_description,
        fs.display_order,
        fs.column_count,
        fs.collapsible,
        fs.initially_collapsed
      FROM lsar_meta.form_definition fd
      LEFT JOIN lsar_meta.form_section fs
        ON fs.form_definition_id = fd.form_definition_id
       AND fs.active = true
      WHERE fd.entity_code = $1
        AND fd.form_type = 'edit'
        AND fd.active = true
      ORDER BY fs.display_order, fs.section_name
    `,
    [entity.entity_code]
  );

  const entityBehaviorResult = await pool.query(
    `
    SELECT
      navigation_label,
      navigation_order,
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
      allow_export
    FROM lsar_meta.entity_behavior
    WHERE entity_code = $1
      AND active = true
    LIMIT 1
    `,
    [entity.entity_code]
  );

  const relationshipsResult = await pool.query(
    `
      SELECT
        relationship_id::text,
        child_entity_code,
        parent_entity_code,
        constraint_name,
        relationship_type,
        fk_columns,
        pk_columns,
        active
      FROM lsar_meta.entity_relationship
      WHERE child_entity_code = $1
         OR parent_entity_code = $1
      ORDER BY child_entity_code, parent_entity_code, relationship_id
    `,
    [entity.entity_code]
  );

  const relationships: CompilerRelationship[] =
    relationshipsResult.rows.map((row) => ({
      relationshipId: row.relationship_id,
      childEntityCode: row.child_entity_code,
      parentEntityCode: row.parent_entity_code,
      constraintName: row.constraint_name,
      relationshipType: row.relationship_type,
      foreignKeyColumns: row.fk_columns,
      primaryKeyColumns: row.pk_columns,
      active: row.active,
    }));

  const parentEntityCodes = [
    ...new Set(
      relationships
        .filter(
          (relationship) =>
            relationship.active &&
            relationship.relationshipType === "foreign_key" &&
            relationship.childEntityCode === entity.entity_code
        )
        .map((relationship) => relationship.parentEntityCode)
    ),
  ];

  const relatedEntityBehaviorResult =
    parentEntityCodes.length > 0
      ? await pool.query<RelatedEntityBehaviorRow>(
          `
          SELECT
            entity_code,
            lookup_display_columns
          FROM lsar_meta.entity_behavior
          WHERE entity_code = ANY($1::text[])
            AND active = true
          `,
          [parentEntityCodes]
        )
      : { rows: [] as RelatedEntityBehaviorRow[] };

  const relatedEntityBehaviors = Object.fromEntries(
    relatedEntityBehaviorResult.rows.map((row) => [
      row.entity_code,
      {
        lookupDisplayColumns: row.lookup_display_columns,
      },
    ])
  );

  const physicalResult = await pool.query<PhysicalTableRow>(
    `
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        CASE
          WHEN c.reltuples < 0 THEN NULL
          ELSE c.reltuples::bigint
        END AS estimated_rows
      FROM pg_class c
      JOIN pg_namespace n
        ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p')
        AND n.nspname = 'lsar_core'
        AND upper(c.relname) = $1
      LIMIT 1
    `,
    [normalizedCode]
  );

  return {
    entity,
    fields,
    relationships,
    formRows: formResult.rows,
    physicalTable: physicalResult.rows[0] ?? null,
    entityBehavior: entityBehaviorResult.rows[0] ?? null,
    relatedEntityBehaviors,
  };
}
