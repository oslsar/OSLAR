import { pool } from "@/lib/db";
import { buildEntityPreview } from "@/lib/compiler/preview";
import type { CompilerPreview } from "@/lib/compiler/types";

export type CompilerLookupItem = {
  key: Record<string, unknown>;
  label: string;
  display: Record<string, unknown>;
};

export type CompilerLookupResult = {
  entityCode: string;
  keyColumns: string[];
  displayColumns: string[];
  searchColumns: string[];
  items: CompilerLookupItem[];
  limit: number;
  query: string | null;
};

type PrimaryKeyColumnRow = {
  column_name: string;
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe database identifier: ${identifier}`);
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

function uniqueColumns(columns: string[]): string[] {
  return [...new Set(columns)];
}

function formatLookupValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

async function getPhysicalPrimaryKeyColumns(
  preview: CompilerPreview
): Promise<string[]> {
  if (!preview.database.tableExists) {
    return [];
  }

  const result = await pool.query<PrimaryKeyColumnRow>(
    `
      SELECT
        a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_class t
        ON t.oid = c.conrelid
      JOIN pg_namespace n
        ON n.oid = t.relnamespace
      JOIN LATERAL unnest(c.conkey)
        WITH ORDINALITY AS key_column(attnum, ordinal_position)
        ON true
      JOIN pg_attribute a
        ON a.attrelid = t.oid
       AND a.attnum = key_column.attnum
      WHERE c.contype = 'p'
        AND n.nspname = $1
        AND t.relname = $2
      ORDER BY key_column.ordinal_position
    `,
    [
      preview.database.schemaName,
      preview.database.tableName,
    ]
  );

  return result.rows.map((row) => row.column_name);
}

export async function getLookupItems(
  entityCode: string,
  options?: {
    query?: string | null;
    limit?: number;
  }
): Promise<CompilerLookupResult | null> {
  const preview = await buildEntityPreview(entityCode);

  if (!preview) {
    return null;
  }

  const requestedLimit = options?.limit ?? 25;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const query = options?.query?.trim() || null;

  const approvedColumns = new Set(
    preview.fields
      .filter(
        (field) =>
          field.included &&
          !field.deprecated &&
          !field.behavior.hidden
      )
      .map((field) => field.columnName)
  );

  const physicalPrimaryKeyColumns =
    await getPhysicalPrimaryKeyColumns(preview);

  const metadataKeyColumns = preview.fields
    .filter(
      (field) =>
        field.included &&
        !field.deprecated &&
        field.isKey
    )
    .map((field) => field.columnName);

  const keyColumns = (
    physicalPrimaryKeyColumns.length > 0
      ? physicalPrimaryKeyColumns
      : metadataKeyColumns
  ).filter((column) => approvedColumns.has(column));

  if (keyColumns.length === 0) {
    throw new Error(
      `No approved key columns were found for ${preview.entity.entityCode}`
    );
  }

  const configuredDisplayColumns =
    preview.behavior?.lookupDisplayColumns ?? [];

  const displayColumns = configuredDisplayColumns.filter(
    (column) =>
      typeof column === "string" &&
      approvedColumns.has(column)
  );

  const effectiveDisplayColumns =
    displayColumns.length > 0
      ? displayColumns
      : keyColumns;

  const configuredSearchColumns =
    preview.behavior?.defaultSearchColumns ?? [];

  const searchColumns = uniqueColumns([
    ...configuredSearchColumns.filter(
      (column) =>
        typeof column === "string" &&
        approvedColumns.has(column)
    ),
    ...effectiveDisplayColumns,
    ...keyColumns,
  ]);

  if (!preview.database.tableExists) {
    return {
      entityCode: preview.entity.entityCode,
      keyColumns,
      displayColumns: effectiveDisplayColumns,
      searchColumns,
      items: [],
      limit,
      query,
    };
  }

  const selectedColumns = uniqueColumns([
    ...keyColumns,
    ...effectiveDisplayColumns,
  ]);

  const schemaSql = quoteIdentifier(
    preview.database.schemaName
  );
  const tableSql = quoteIdentifier(
    preview.database.tableName
  );
  const selectSql = selectedColumns
    .map(quoteIdentifier)
    .join(", ");

  const parameters: unknown[] = [];
  let whereSql = "";

  if (query && searchColumns.length > 0) {
    parameters.push(`%${query}%`);

    const searchSql = searchColumns
      .map(
        (column) =>
          `${quoteIdentifier(column)}::text ILIKE $1`
      )
      .join(" OR ");

    whereSql = `WHERE (${searchSql})`;
  }

  parameters.push(limit);
  const limitParameter = `$${parameters.length}`;

  const orderColumns = uniqueColumns([
    ...effectiveDisplayColumns,
    ...keyColumns,
  ]);

  const orderSql = orderColumns
    .map(
      (column) =>
        `${quoteIdentifier(column)} ASC NULLS LAST`
    )
    .join(", ");

  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT ${selectSql}
      FROM ${schemaSql}.${tableSql}
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${limitParameter}
    `,
    parameters
  );

  const items = result.rows.map((row) => {
    const key = Object.fromEntries(
      keyColumns.map((column) => [
        column,
        row[column] ?? null,
      ])
    );

    const display = Object.fromEntries(
      effectiveDisplayColumns.map((column) => [
        column,
        row[column] ?? null,
      ])
    );

    const labelParts = effectiveDisplayColumns
      .map((column) => formatLookupValue(row[column]))
      .filter((value) => value.length > 0);

    const fallbackLabelParts = keyColumns
      .map((column) => formatLookupValue(row[column]))
      .filter((value) => value.length > 0);

    return {
      key,
      display,
      label:
        labelParts.length > 0
          ? labelParts.join(" · ")
          : fallbackLabelParts.join(" · "),
    };
  });

  return {
    entityCode: preview.entity.entityCode,
    keyColumns,
    displayColumns: effectiveDisplayColumns,
    searchColumns,
    items,
    limit,
    query,
  };
}
