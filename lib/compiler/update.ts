import { pool } from "@/lib/db";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { validateEntityPayload } from "@/lib/compiler/validation";
import { coerceEntityPayload } from "@/lib/compiler/coercion";
import { validateForeignKeys } from "@/lib/compiler/foreign-keys";

export type CompilerUpdateResult =
  | {
      ok: true;
      status: 200;
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

export async function updateEntityRecord(
  entityCode: string,
  keyValues: Record<string, unknown>,
  payload: Record<string, unknown>
): Promise<CompilerUpdateResult> {
  const preview = await buildEntityPreview(entityCode);

  if (!preview) {
    return {
      ok: false,
      status: 404,
      error: "Entity not found",
    };
  }

  if (!preview.behavior?.allowEdit) {
    return {
      ok: false,
      status: 403,
      stage: "permission",
      error: `Edit is not enabled for ${preview.entity.entityCode}.`,
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
        `Missing original key values: ${missingKeys.join(", ")}.`,
    };
  }

  for (const column of keyColumns) {
    if (
      Object.prototype.hasOwnProperty.call(payload, column) &&
      String(payload[column] ?? "") !==
        String(keyValues[column] ?? "")
    ) {
      return {
        ok: false,
        status: 422,
        stage: "validation",
        error:
          `Primary-key field ${column} cannot be changed during edit.`,
      };
    }
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

  const editableColumns = new Set(
    preview.gui.generatedFields
      .filter(
        (field) =>
          !field.readOnly &&
          !keyColumns.includes(field.columnName)
      )
      .map((field) => field.columnName)
  );

  const entries = Object.entries(
    coercion.values
  ).filter(([columnName]) =>
    editableColumns.has(columnName)
  );

  if (entries.length === 0) {
    return {
      ok: false,
      status: 422,
      stage: "validation",
      error: "No editable values were supplied.",
    };
  }

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );

  const setSql = entries
    .map(
      ([columnName], index) =>
        `${quoteIdentifier(columnName)} = $${index + 1}`
    )
    .join(", ");

  const whereSql = keyColumns
    .map(
      (columnName, index) =>
        `${quoteIdentifier(columnName)} = $${
          entries.length + index + 1
        }`
    )
    .join(" AND ");

  const parameters = [
    ...entries.map(([, value]) => value),
    ...keyColumns.map((column) => keyValues[column]),
  ];

  try {
    const result =
      await pool.query<Record<string, unknown>>(
        `
          UPDATE ${schemaSql}.${tableSql}
          SET ${setSql}
          WHERE ${whereSql}
          RETURNING *
        `,
        parameters
      );

    if (result.rows.length === 0) {
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

    if (pgError.code === "23503") {
      return {
        ok: false,
        status: 409,
        stage: "database",
        error:
          "A referenced record no longer exists.",
      };
    }

    if (pgError.code === "23505") {
      return {
        ok: false,
        status: 409,
        stage: "database",
        error:
          "The update would create a duplicate key.",
      };
    }

    throw error;
  }
}
