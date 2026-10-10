import { pool } from "@/lib/db";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { validateEntityPayload } from "@/lib/compiler/validation";
import { coerceEntityPayload } from "@/lib/compiler/coercion";
import { validateForeignKeys } from "@/lib/compiler/foreign-keys";

export type CompilerCreateResult =
  | {
      ok: true;
      status: 201;
      entityCode: string;
      values: Record<string, unknown>;
      row: Record<string, unknown>;
    }
  | {
      ok: false;
      status: number;
      error: string;
      stage?:
        | "permission"
        | "validation"
        | "coercion"
        | "foreign_keys"
        | "database";
      errors?: unknown[];
    };

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Unsafe database identifier: ${identifier}`
    );
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function createEntityRecord(
  entityCode: string,
  payload: Record<string, unknown>
): Promise<CompilerCreateResult> {
  const preview = await buildEntityPreview(entityCode);

  if (!preview) {
    return {
      ok: false,
      status: 404,
      error: "Entity not found",
    };
  }

  if (!preview.behavior?.allowCreate) {
    return {
      ok: false,
      status: 403,
      stage: "permission",
      error: `Create is not enabled for ${preview.entity.entityCode}.`,
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

  const validation = validateEntityPayload(
    preview,
    payload
  );

  if (!validation.valid) {
    return {
      ok: false,
      status: 422,
      stage: "validation",
      error: "Payload validation failed.",
      errors: validation.errors,
    };
  }

  const coercion = coerceEntityPayload(
    preview,
    payload
  );

  if (!coercion.valid) {
    return {
      ok: false,
      status: 422,
      stage: "coercion",
      error: "Payload coercion failed.",
      errors: coercion.errors,
    };
  }

  const foreignKeys = await validateForeignKeys(
    preview,
    coercion.values
  );

  if (!foreignKeys.valid) {
    return {
      ok: false,
      status: 422,
      stage: "foreign_keys",
      error: "Foreign-key validation failed.",
      errors: foreignKeys.errors,
    };
  }

  const approvedColumns = new Set(
    preview.gui.generatedFields.map(
      (field) => field.columnName
    )
  );

  const entries = Object.entries(
    coercion.values
  ).filter(([columnName]) =>
    approvedColumns.has(columnName)
  );

  if (entries.length === 0) {
    return {
      ok: false,
      status: 422,
      stage: "validation",
      error: "No approved values were supplied.",
    };
  }

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );

  const columns = entries.map(
    ([columnName]) => columnName
  );
  const parameters = entries.map(
    ([, value]) => value
  );

  const columnSql = columns
    .map(quoteIdentifier)
    .join(", ");

  const parameterSql = parameters
    .map((_, index) => `$${index + 1}`)
    .join(", ");

  try {
    const result =
      await pool.query<Record<string, unknown>>(
        `
          INSERT INTO ${schemaSql}.${tableSql}
            (${columnSql})
          VALUES
            (${parameterSql})
          RETURNING *
        `,
        parameters
      );

    return {
      ok: true,
      status: 201,
      entityCode: preview.entity.entityCode,
      values: coercion.values,
      row: result.rows[0],
    };
  } catch (error: unknown) {
    const pgError =
      error as {
        code?: string;
        constraint?: string;
        detail?: string;
      };

    if (pgError.code === "23505") {
      return {
        ok: false,
        status: 409,
        stage: "database",
        error:
          "A record with the same key already exists.",
      };
    }

    if (pgError.code === "23503") {
      return {
        ok: false,
        status: 409,
        stage: "database",
        error:
          "A referenced record no longer exists.",
      };
    }

    throw error;
  }
}
