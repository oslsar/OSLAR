import Link from "next/link";
import { notFound } from "next/navigation";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { getEntityRecord } from "@/lib/compiler/data";
import GeneratedForm from "@/components/compiler/generated-form";

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

  const hasAllKeyValues = keyColumns.every(
    (column) => typeof keyValues[column] === "string"
  );

  if (!hasAllKeyValues) {
    notFound();
  }

  const record = await getEntityRecord(
    preview,
    keyValues
  );

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

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-950">
          Edit record
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Generated from compiler metadata. Primary-key fields are read-only.
        </p>

        <GeneratedForm
          entityCode={preview.entity.entityCode}
          form={preview.gui.form}
          mode="edit"
          initialValues={record.row ?? undefined}
          keyColumns={record.keyColumns}
        />
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
