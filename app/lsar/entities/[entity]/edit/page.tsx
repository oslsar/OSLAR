import Link from "next/link";
import { notFound } from "next/navigation";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { getEntityRecord } from "@/lib/compiler/data";

export const dynamic = "force-dynamic";

export default async function EditEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { entity } = await params;
  const query = await searchParams;

  const preview = await buildEntityPreview(entity);

  if (!preview) {
    notFound();
  }

  const keyColumns = preview.fields
    .filter(
      (field) =>
        field.included &&
        !field.deprecated &&
        field.isKey
    )
    .map((field) => field.columnName);

  const keyValues: Record<string, string> = {};

  for (const column of keyColumns) {
    const value = query[column];

    if (typeof value === "string") {
      keyValues[column] = value;
    }
  }

  const record = await getEntityRecord(
    preview,
    keyValues
  );

  if (!record.row) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Link
          href={`/lsar/entities/${encodeURIComponent(
            preview.entity.entityCode
          )}`}
          className="text-sm font-medium text-blue-700 no-underline hover:underline"
        >
          ← Back to {preview.entity.entityCode}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-950">
          {preview.entity.entityCode} record
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Loaded by compiler-defined primary key.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="grid gap-4 md:grid-cols-2">
          {preview.gui.generatedFields.map((field) => (
            <div
              key={field.columnName}
              className="rounded-md border border-gray-100 p-3"
            >
              <dt className="text-sm font-medium text-gray-900">
                {field.label}
              </dt>

              <dd className="mt-1 text-sm text-gray-700">
                {formatValue(record.row?.[field.columnName])}
              </dd>

              <div className="mt-1 text-xs text-gray-400">
                {field.columnName}
              </div>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}
