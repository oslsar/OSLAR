import { pool } from "@/lib/db";
import type { CompilerPreview } from "@/lib/compiler/types";

export type CompilerDataResult = {
  columns: string[];
  keyColumns: string[];
  rows: Record<string, unknown>[];
  limit: number;
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function getEntityRows(
  preview: CompilerPreview,
  requestedLimit = 25
): Promise<CompilerDataResult> {
  if (!preview.database.tableExists) {
    return {
      columns: preview.gui.listColumns,
      keyColumns: preview.fields
        .filter(
          (field) =>
            field.included &&
            !field.deprecated &&
            field.isKey
        )
        .map((field) => field.columnName),
      rows: [],
      limit: 0,
    };
  }

  const limit = Math.min(Math.max(requestedLimit, 1), 100);

  const approvedColumns = new Set(
    preview.fields
      .filter((field) => field.included && !field.deprecated)
      .map((field) => field.columnName)
  );

  const keyColumns = preview.fields
    .filter(
      (field) =>
        field.included &&
        !field.deprecated &&
        field.isKey
    )
    .map((field) => field.columnName)
    .filter((column) => approvedColumns.has(column));

  const columns = preview.gui.listColumns.filter((column) =>
    approvedColumns.has(column)
  );

  if (columns.length === 0 && keyColumns.length === 0) {
    return {
      columns: [],
      keyColumns: [],
      rows: [],
      limit,
    };
  }

  const schemaSql = quoteIdentifier(preview.database.schemaName);
  const tableSql = quoteIdentifier(preview.database.tableName);
  const selectedColumns = [
    ...new Set([
      ...columns,
      ...keyColumns,
    ]),
  ];

  const columnSql = selectedColumns
    .map(quoteIdentifier)
    .join(", ");

  const defaultSort =
    preview.gui.defaultSort &&
    approvedColumns.has(preview.gui.defaultSort)
      ? preview.gui.defaultSort
      : keyColumns[0] ??
        columns[0] ??
        selectedColumns[0];

  const orderSql = quoteIdentifier(defaultSort);

  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT ${columnSql}
      FROM ${schemaSql}.${tableSql}
      ORDER BY ${orderSql} ASC NULLS LAST
      LIMIT $1
    `,
    [limit]
  );

  return {
    columns,
    keyColumns,
    rows: result.rows,
    limit,
  };
}
