import { pool } from "@/lib/db";
import { listPredicate, type ListCriteria } from "@/lib/compiler/list-query";
import type { CompilerPreview } from "@/lib/compiler/types";

export type CompilerDataResult = {
  columns: string[];
  keyColumns: string[];
  rows: Record<string, unknown>[];
  limit: number;
  page: number;
  totalCount: number;
};

export type CompilerRecordResult = {
  keyColumns: string[];
  row: Record<string, unknown> | null;
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

export async function getEntityRows(
  preview: CompilerPreview,
  requestedLimit = 25,
  criteria: ListCriteria = { search: "", filters: [], page: 1 }
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
      page: 1,
      totalCount: 0,
    };
  }

  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100) : 25;
  const requestedPage = Number.isSafeInteger(criteria.page) && criteria.page > 0 ? criteria.page : 1;

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
      page: 1,
      totalCount: 0,
    };
  }

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );

  const selectedColumns = [
    ...new Set([
      ...columns,
      ...keyColumns,
    ]),
  ];

  // JSON aggregation must retain pg's string representation of exact decimals/bigints.
  const columnSql = selectedColumns.map(column => {
    const quoted = quoteIdentifier(column);
    const spec = preview.fields.find(field => field.columnName === column)?.formatSpec?.trim().toLowerCase() ?? "";
    return /^(numeric|decimal|bigint)/.test(spec) ? `${quoted}::text AS ${quoted}` : quoted;
  }).join(", ");

  const defaultSort =
    preview.gui.defaultSort &&
    approvedColumns.has(preview.gui.defaultSort)
      ? preview.gui.defaultSort
      : keyColumns[0] ??
        columns[0] ??
        selectedColumns[0];

  const direction = preview.behavior?.defaultSortDirection === "desc" ? "DESC" : "ASC";
  const orderSql = [defaultSort, ...keyColumns.filter(column => column !== defaultSort)]
    .map(column => `list_source.${quoteIdentifier(column)} ${direction} NULLS LAST`).join(", ");
  const predicate = listPredicate(preview, criteria);
  const limitParameter = predicate.values.length + 1;
  const pageParameter = limitParameter + 1;
  // Count and rows share one statement/snapshot. Clamp stale bookmarked pages.
  const result = await pool.query<{
    total_count: string; page: string; records: Record<string, unknown>[];
  }>(`
    WITH totals AS (
      SELECT count(*) AS total_count FROM ${schemaSql}.${tableSql} ${predicate.sql}
    ), paging AS (
      SELECT total_count, LEAST($${pageParameter}::bigint,
        GREATEST(1, CEIL(total_count::numeric / $${limitParameter}::integer)))::bigint AS page
      FROM totals
    )
    SELECT total_count, page,
      COALESCE((SELECT json_agg(records) FROM (
        SELECT ${columnSql} FROM ${schemaSql}.${tableSql} AS list_source ${predicate.sql}
        ORDER BY ${orderSql}
        LIMIT $${limitParameter}::integer
        OFFSET ((paging.page - 1) * $${limitParameter}::integer)
      ) records), '[]'::json) AS records
    FROM paging
  `, [...predicate.values, limit, requestedPage]);
  const resultPage = result.rows[0];
  return {
    columns, keyColumns, rows: resultPage?.records ?? [], limit,
    page: Number(resultPage?.page ?? 1), totalCount: Number(resultPage?.total_count ?? 0),
  };
}

export async function getEntityRecord(
  preview: CompilerPreview,
  keyValues: Record<string, string>
): Promise<CompilerRecordResult> {
  if (!preview.database.tableExists) {
    return {
      keyColumns: [],
      row: null,
    };
  }

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

  if (keyColumns.length === 0) {
    throw new Error(
      `Entity ${preview.entity.entityCode} has no compiler-approved key fields`
    );
  }

  const missingKeyColumns = keyColumns.filter(
    (column) => !keyValues[column]
  );

  if (missingKeyColumns.length > 0) {
    throw new Error(
      `Missing key values: ${missingKeyColumns.join(", ")}`
    );
  }

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );

  const selectedColumns = preview.fields
    .filter(
      (field) =>
        field.included &&
        !field.deprecated
    )
    .map((field) => field.columnName);

  const columnSql = selectedColumns
    .map(quoteIdentifier)
    .join(", ");

  const whereSql = keyColumns
    .map(
      (column, index) =>
        `${quoteIdentifier(column)} = $${index + 1}`
    )
    .join(" AND ");

  const parameters = keyColumns.map(
    (column) => keyValues[column]
  );

  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT ${columnSql}
      FROM ${schemaSql}.${tableSql}
      WHERE ${whereSql}
      LIMIT 1
    `,
    parameters
  );

  return {
    keyColumns,
    row: result.rows[0] ?? null,
  };
}
