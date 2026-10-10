import { pool } from "@/lib/db";
import { buildEntityPreview } from "@/lib/compiler/preview";

export type CompilerIntegrityIssue = {
  severity: "warning" | "error";
  code:
    | "metadata_field_missing_physically"
    | "physical_column_missing_metadata"
    | "format_mismatch";
  columnName: string;
  message: string;
};

export type CompilerIntegrityResult = {
  entityCode: string;
  valid: boolean;
  issues: CompilerIntegrityIssue[];
};

type PhysicalColumnRow = {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_nullable: string;
};

function normalizePhysicalFormat(
  row: PhysicalColumnRow
): string {
  switch (row.data_type) {
    case "character varying":
      return row.character_maximum_length === null
        ? "string(unlimited)"
        : `string(${row.character_maximum_length})`;

    case "text":
      return "string(unlimited)";

    case "boolean":
      return "boolean";

    case "integer":
    case "smallint":
    case "bigint":
      return "integer";

    case "numeric":
    case "decimal":
      return row.numeric_precision !== null &&
        row.numeric_scale !== null
        ? `decimal(${row.numeric_precision},${row.numeric_scale})`
        : "decimal";

    case "date":
      return "date";

    case "timestamp without time zone":
    case "timestamp with time zone":
      return "datetime";

    default:
      return row.data_type;
  }
}

function formatsCompatible(
  metadataFormat: string | null,
  physicalFormat: string
): boolean {
  if (!metadataFormat) {
    return true;
  }

  const metadata =
    metadataFormat.trim().toLowerCase();

  const physical =
    physicalFormat.trim().toLowerCase();

  if (metadata === physical) {
    return true;
  }

  if (
    metadata.startsWith("integer(") &&
    physical === "integer"
  ) {
    return true;
  }

  return false;
}

export async function checkEntityIntegrity(
  entityCode: string
): Promise<CompilerIntegrityResult | null> {
  const preview = await buildEntityPreview(entityCode);

  if (!preview) {
    return null;
  }

  if (!preview.database.tableExists) {
    return {
      entityCode: preview.entity.entityCode,
      valid: false,
      issues: [
        {
          severity: "error",
          code: "metadata_field_missing_physically",
          columnName: "*",
          message:
            `Physical table ${preview.database.schemaName}.` +
            `${preview.database.tableName} does not exist.`,
        },
      ],
    };
  }

  const physicalResult =
    await pool.query<PhysicalColumnRow>(
      `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
        ORDER BY ordinal_position
      `,
      [
        preview.database.schemaName,
        preview.database.tableName,
      ]
    );

  const metadataFields = new Map(
    preview.fields
      .filter(
        (field) =>
          field.included &&
          !field.deprecated
      )
      .map((field) => [
        field.columnName,
        field,
      ])
  );

  const physicalColumns = new Map(
    physicalResult.rows.map((column) => [
      column.column_name,
      column,
    ])
  );

  const issues: CompilerIntegrityIssue[] = [];

  for (const [columnName, field] of metadataFields) {
    const physical = physicalColumns.get(columnName);

    if (!physical) {
      issues.push({
        severity: "error",
        code: "metadata_field_missing_physically",
        columnName,
        message:
          `${columnName} exists in compiler metadata but ` +
          `not in ${preview.database.schemaName}.` +
          `${preview.database.tableName}.`,
      });

      continue;
    }

    const physicalFormat =
      normalizePhysicalFormat(physical);

    if (
      !formatsCompatible(
        field.formatSpec,
        physicalFormat
      )
    ) {
      issues.push({
        severity: "warning",
        code: "format_mismatch",
        columnName,
        message:
          `${columnName}: metadata format ` +
          `${field.formatSpec ?? "unknown"} differs from ` +
          `physical format ${physicalFormat}.`,
      });
    }
  }

  for (const [columnName] of physicalColumns) {
    if (!metadataFields.has(columnName)) {
      issues.push({
        severity: "warning",
        code: "physical_column_missing_metadata",
        columnName,
        message:
          `${columnName} exists physically in ` +
          `${preview.database.schemaName}.` +
          `${preview.database.tableName} but has no active ` +
          `compiler field metadata.`,
      });
    }
  }

  return {
    entityCode: preview.entity.entityCode,
    valid: !issues.some(
      (issue) => issue.severity === "error"
    ),
    issues,
  };
}
