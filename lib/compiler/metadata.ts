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
        count(m.mapping_id)::integer AS normalized_mapping_count
      FROM lsar_meta.field_def f
      LEFT JOIN lsar_meta.field_standard_mapping m
        ON m.field_def_id = f.field_def_id
       AND m.active = true
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
        f.s3000l
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
    standards: {
      ded: row.ded,
      geiaShortName: row.geia_short_name,
      mil1388Field: row.mil_1388_field,
      defStan0060: row.def_std_00_60,
      s3000l: row.s3000l,
      normalizedMappings: row.normalized_mapping_count,
    },
  }));

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
    physicalTable: physicalResult.rows[0] ?? null,
  };
}
