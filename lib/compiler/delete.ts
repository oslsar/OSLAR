import { pool } from "@/lib/db";
import { buildEntityPreview } from "@/lib/compiler/preview";

export type CompilerDeleteResult =
  | {
      ok: true;
      status: 200;
      entityCode: string;
      deletedKey: Record<string, unknown>;
    }
  | {
      ok: false;
      status: number;
      error: string;
      stage?:
        | "permission"
        | "validation"
        | "database";
    };

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Unsafe database identifier: ${identifier}`
    );
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function deleteEntityRecord(
  entityCode: string,
  keyValues: Record<string, unknown>
): Promise<CompilerDeleteResult> {
  const preview = await buildEntityPreview(entityCode);

  if (!preview) {
    return {
      ok: false,
      status: 404,
      error: "Entity not found",
    };
  }

  if (!preview.behavior?.allowDelete) {
    return {
      ok: false,
      status: 403,
      stage: "permission",
      error:
        `Delete is not enabled for ${preview.entity.entityCode}.`,
    };
  }

  if (!preview.database.tableExists) {
    return {
      ok: false,
      status: 409,
      stage: "database",
      error:
        `Physical table ${preview.database.schemaName}.` +
        `${preview.database.tableName} does not exist.`,
    };
  }

  const keyColumns = preview.fields
    .filter(
      (field) =>
        field.included &&
        !field.deprecated &&
        field.isKey
    )
    .map((field) => field.columnName);

  if (keyColumns.length === 0) {
    return {
      ok: false,
      status: 409,
      stage: "database",
      error:
        `Entity ${preview.entity.entityCode} has no compiler-approved key fields.`,
    };
  }

  const missingKeys = keyColumns.filter(
    (column) =>
      keyValues[column] === undefined ||
      keyValues[column] === null ||
      String(keyValues[column]) === ""
  );

  if (missingKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      stage: "validation",
      error:
        `Missing key values: ${missingKeys.join(", ")}.`,
    };
  }

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );

  const whereSql = keyColumns
    .map(
      (column, index) =>
        `${quoteIdentifier(column)} = $${index + 1}`
    )
    .join(" AND ");

  const parameters = keyColumns.map(
    (column) => keyValues[column]
  );

  try {
    const result = await pool.query(
      `
        DELETE FROM ${schemaSql}.${tableSql}
        WHERE ${whereSql}
        RETURNING 1
      `,
      parameters
    );

    if (result.rowCount === 0) {
      return {
        ok: false,
        status: 404,
        stage: "database",
        error: "Record not found.",
      };
    }

    return {
      ok: true,
      status: 200,
      entityCode: preview.entity.entityCode,
      deletedKey: Object.fromEntries(
        keyColumns.map((column) => [
          column,
          keyValues[column],
        ])
      ),
    };
  } catch (error: unknown) {
    const pgError = error as {
      code?: string;
    };

    if (pgError.code === "23503") {
      return {
        ok: false,
        status: 409,
        stage: "database",
        error:
          "This record is referenced by other records and cannot be deleted.",
      };
    }

    throw error;
  }
}
