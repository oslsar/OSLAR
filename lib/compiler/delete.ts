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
        | "database"
        | "relationships";
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

  const suppliedColumns = Object.keys(keyValues);
  if (suppliedColumns.some(column => !keyColumns.includes(column))) {
    return { ok: false, status: 400, stage: "validation", error: "Only compiler-approved primary-key columns may identify a record." };
  }
  if (suppliedColumns.some(column => {
    const value = keyValues[column];
    return !["string", "number", "boolean"].includes(typeof value) ||
      (typeof value === "number" && !Number.isFinite(value));
  })) {
    return { ok: false, status: 400, stage: "validation", error: "Key values must be scalar values." };
  }

  const missingKeys = keyColumns.filter(
    (column) =>
      !Object.prototype.hasOwnProperty.call(keyValues, column) ||
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

  const incoming = preview.relationships.filter(relationship =>
    relationship.active && relationship.parentEntityCode === preview.entity.entityCode &&
    ["foreign_key", "reference_lookup"].includes(relationship.relationshipType)
  );
  const parentColumns = new Set(preview.fields.filter(field => field.included && !field.deprecated).map(field => field.columnName));
  const dependencies = [];
  for (const relationship of incoming) {
    const child = relationship.childEntityCode === preview.entity.entityCode
      ? preview : await buildEntityPreview(relationship.childEntityCode);
    const childColumns = new Set(child?.fields.filter(field => field.included && !field.deprecated).map(field => field.columnName));
    if (!child?.database.tableExists ||
      !Array.isArray(relationship.foreignKeyColumns) || !Array.isArray(relationship.primaryKeyColumns) ||
      !relationship.foreignKeyColumns.length ||
      relationship.foreignKeyColumns.length !== relationship.primaryKeyColumns.length ||
      relationship.primaryKeyColumns.some(column => !parentColumns.has(column)) ||
      relationship.foreignKeyColumns.some(column => !childColumns.has(column))) {
      return { ok: false, status: 409, stage: "relationships", error: `Cannot safely verify dependent records in ${relationship.childEntityCode}.` };
    }
    dependencies.push({ relationship, child,
      table: `${quoteIdentifier(child.database.schemaName)}.${quoteIdentifier(child.database.tableName)}` });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // No physical FK is required. Freeze writes to the parent and metadata-defined
    // child tables while checking references and deleting; acquire locks in stable order.
    const tables = [...new Set([`${schemaSql}.${tableSql}`, ...dependencies.map(dependency => dependency.table)])].sort();
    await client.query(`LOCK TABLE ${tables.join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
    const selectedColumns = [...new Set([...keyColumns, ...incoming.flatMap(relationship => relationship.primaryKeyColumns)])];
    const parent = await client.query<Record<string, unknown>>(
      `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")} FROM ${schemaSql}.${tableSql} WHERE ${whereSql}`,
      parameters
    );
    if (parent.rowCount !== 1) {
      await client.query("ROLLBACK");
      return { ok: false, status: parent.rowCount === 0 ? 404 : 409, stage: "database", error: parent.rowCount === 0 ? "Record not found." : "Primary key did not identify exactly one record." };
    }
    for (const { relationship, table } of dependencies) {
      const conditions = relationship.foreignKeyColumns.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`).join(" AND ");
      const references = await client.query(
        `SELECT 1 FROM ${table} WHERE ${conditions} LIMIT 1`,
        relationship.primaryKeyColumns.map(column => parent.rows[0][column])
      );
      if (references.rows.length > 0) {
        await client.query("ROLLBACK");
        return { ok: false, status: 409, stage: "relationships", error: `Cannot delete this record because it is referenced by ${relationship.childEntityCode}.` };
      }
    }
    const result = await client.query(
      `DELETE FROM ${schemaSql}.${tableSql} WHERE ${whereSql} RETURNING 1`, parameters
    );
    if (result.rowCount !== 1) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, stage: "database", error: "Deletion did not affect exactly one record; no changes were saved." };
    }
    await client.query("COMMIT");
    return {
      ok: true, status: 200, entityCode: preview.entity.entityCode,
      deletedKey: Object.fromEntries(keyColumns.map(column => [column, keyValues[column]])),
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return { ok: false, status: 409, stage: "database", error: "This record is referenced by other records and cannot be deleted." };
    }
    throw error;
  } finally {
    client.release();
  }
}
