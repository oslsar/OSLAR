import Link from "next/link";
import { notFound } from "next/navigation";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { getEntityRows } from "@/lib/compiler/data";

export const dynamic = "force-dynamic";

export default async function EntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;
  const preview = await buildEntityPreview(entity);

  if (!preview) {
    notFound();
  }

  const data = await getEntityRows(preview, 25);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Metadata-generated entity
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            {preview.entity.entityCode}
            {preview.entity.entityName
              ? ` — ${preview.entity.entityName}`
              : ""}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {preview.database.schemaName}.{preview.database.tableName}
          </p>
        </div>

        <Link
          href={`/api/compiler/entities/${encodeURIComponent(
            preview.entity.entityCode
          )}/preview`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 no-underline hover:bg-gray-50"
        >
          View compiler JSON
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Fields"
          value={preview.summary.fieldCount}
        />
        <SummaryCard
          label="Key fields"
          value={preview.summary.keyFieldCount}
        />
        <SummaryCard
          label="Relationships"
          value={preview.summary.relationshipCount}
        />
        <SummaryCard
          label="Standards mappings"
          value={preview.summary.normalizedMappingCount}
        />
      </section>



      {preview.warnings.length > 0 && (
        <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">
            Compiler warnings
          </h2>

          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            {preview.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-950">
          Proposed list view
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Generated automatically from included fields, keys and display order.
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Showing up to {data.limit} read-only records.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {data.columns.map((column) => {
                  const field = preview.fields.find(
                    (item) => item.columnName === column
                  );

                  return (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700"
                    >
                      {field?.displayName ?? column}
                      <div className="text-xs font-normal text-gray-400">
                        {column}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(data.columns.length, 1)}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {data.columns.map((column) => (
                      <td
                        key={column}
                        className="max-w-xs whitespace-nowrap px-4 py-3 text-gray-700"
                      >
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-950">
          Proposed form
        </h2>


        <p className="mt-1 text-sm text-gray-600">
          These controls were inferred from field metadata and format rules.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {preview.gui.generatedFields.map((field) => (
            <div
              key={field.columnName}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <label className="text-sm font-semibold text-gray-900">
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-red-600">*</span>
                  )}
                </label>

                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {field.controlType}
                </span>
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {field.columnName}
                {field.formatSpec ? ` · ${field.formatSpec}` : ""}
              </div>

              <input
                disabled
                placeholder={
                  field.placeholder ??
                  (field.readOnly
                    ? "Key field"
                    : `Enter ${field.label.toLowerCase()}`)
                }
                className="mt-3 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />

              {field.helpText && (
                <p className="mt-2 text-xs text-gray-500">
                  {field.helpText}
                </p>
              )}

              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                {field.readOnly && <span>Read-only after creation</span>}
                {field.searchable && <span>Searchable</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-950">
        {value}
      </div>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}