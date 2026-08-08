import { pool } from "@/lib/db";
import type {
  CompilerForeignKeyValidationResult,
  CompilerPreview,
  CompilerRelationship,
  CompilerValidationError,
} from "@/lib/compiler/types";

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Unsafe database identifier: ${identifier}`
    );
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

function hasValue(value: unknown): boolean {
  return !(
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      value.trim() === "")
  );
}

function relationshipLabel(
  relationship: CompilerRelationship
): string {
  return (
    relationship.constraintName ??
    `${relationship.childEntityCode} → ${relationship.parentEntityCode}`
  );
}

export async function validateForeignKeys(
  preview: CompilerPreview,
  values: Record<string, unknown>
): Promise<CompilerForeignKeyValidationResult> {
  const errors: CompilerValidationError[] = [];

  const outgoingRelationships =
    preview.relationships.filter(
      (relationship) =>
        relationship.active &&
        relationship.relationshipType === "foreign_key" &&
        relationship.childEntityCode ===
          preview.entity.entityCode
    );

  for (const relationship of outgoingRelationships) {
    if (
      relationship.foreignKeyColumns.length !==
      relationship.primaryKeyColumns.length
    ) {
      throw new Error(
        `Relationship ${relationship.relationshipId} has mismatched FK and PK column counts`
      );
    }

    const supplied = relationship.foreignKeyColumns.map(
      (column) => hasValue(values[column])
    );

    const suppliedCount = supplied.filter(Boolean).length;

    /*
     * A completely empty optional FK is valid.
     */
    if (suppliedCount === 0) {
      continue;
    }

    /*
     * Composite relationships must be supplied completely.
     */
    if (
      suppliedCount !==
      relationship.foreignKeyColumns.length
    ) {
      errors.push({
        columnName:
          relationship.foreignKeyColumns.join(","),
        label: relationshipLabel(relationship),
        code: "partial_foreign_key",
        message:
          `${relationshipLabel(relationship)} requires all ` +
          `${relationship.foreignKeyColumns.length} key fields.`,
      });

      continue;
    }

    const conditions =
      relationship.primaryKeyColumns.map(
        (parentColumn, index) =>
          `${quoteIdentifier(parentColumn)} = $${index + 1}`
      );

    const parameters =
      relationship.foreignKeyColumns.map(
        (childColumn) => values[childColumn]
      );

    /*
     * LSAR entities currently compile into lsar_core using
     * entity codes as physical table names.
     */
    const schemaSql = quoteIdentifier("lsar_core");
    const tableSql = quoteIdentifier(
      relationship.parentEntityCode
    );

    const result = await pool.query(
      `
        SELECT 1
        FROM ${schemaSql}.${tableSql}
        WHERE ${conditions.join(" AND ")}
        LIMIT 1
      `,
      parameters
    );

    if (result.rowCount === 0) {
      errors.push({
        columnName:
          relationship.foreignKeyColumns.join(","),
        label: relationshipLabel(relationship),
        code: "foreign_key_not_found",
        message:
          `Referenced ${relationship.parentEntityCode} ` +
          `record was not found.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
