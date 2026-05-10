type TailoringImpact = {
  table: string;
  summary: string;
  affected?: {
    tables?: string[];
    views?: string[];
    exports?: string[];
    api?: string[];
  };
  warnings?: string[];
  recommendations?: string[];
};

export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  // For now: demo impact data derived from other demo endpoints.
  // Later: replace with /demo/api/tailoring-impact?table=...
  const [schemaRes, constraintsRes] = await Promise.all([
    fetch(
      `http://localhost:3000/demo/api/schema?table=${encodeURIComponent(table)}`,
      { cache: "no-store" }
    ),
    fetch(
      `http://localhost:3000/demo/api/constraints?table=${encodeURIComponent(table)}`,
      { cache: "no-store" }
    ),
  ]);

  if (!schemaRes.ok) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        No tailoring impact available (unknown table).
      </div>
    );
  }

  const schema = await schemaRes.json();
  const constraints = constraintsRes.ok ? await constraintsRes.json() : null;

  // Demo-only: fabricate a reasonable “impact” object.
  const impact: TailoringImpact = {
    table: schema.name,
    summary:
      "Tailoring impact estimates what will break (or need regeneration) if this table/fields are removed from the tailored schema.",
    affected: {
      tables: [`${schema.name}`],
      views: [`v_${schema.name}_summary (demo)`],
      exports: ["SQL DDL export", "Data Dictionary export"],
      api: ["/demo/api/schema", "/demo/api/constraints", "/demo/api/mapping"],
    },
    warnings: [
      constraints?.foreignKeys?.length
        ? "Foreign keys exist — removing this table may cascade to dependent entities."
        : "No foreign keys detected (demo).",
      "Regenerate crosswalk coverage after tailoring changes (demo).",
    ],
    recommendations: [
      "Create a tailoring profile version tag (e.g., v1.0) before removing fields.",
      "Run schema validation + export preview after each change.",
      "Capture an audit note explaining the tailoring rationale.",
    ],
  };

  const cols = Array.isArray(schema.columns) ? schema.columns : [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold">Summary</div>
        <div className="mt-2 text-sm text-gray-700">{impact.summary}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Included Fields</div>
          <div className="text-xs text-gray-500">{cols.length} columns</div>
        </div>

        <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Column</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Tailoring</th>
              </tr>
            </thead>
            <tbody>
              {cols.map((c: any) => (
                <tr key={c.name} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-mono text-xs">{c.name}</td>
                  <td className="px-4 py-2">{c.type}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      included
                    </span>
                  </td>
                </tr>
              ))}

              {!cols.length && (
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                    No columns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Next step: add checkboxes + “Preview tailored schema” (demo).
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold">Affected Artifacts</div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500">Tables</div>
            <div className="mt-2 text-sm text-gray-800">
              {(impact.affected?.tables ?? []).join(", ") || "—"}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500">Views</div>
            <div className="mt-2 text-sm text-gray-800">
              {(impact.affected?.views ?? []).join(", ") || "—"}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500">Exports</div>
            <div className="mt-2 text-sm text-gray-800">
              {(impact.affected?.exports ?? []).join(", ") || "—"}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500">API</div>
            <div className="mt-2 text-sm text-gray-800">
              {(impact.affected?.api ?? []).join(", ") || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold">Warnings</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {(impact.warnings ?? []).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold">Recommendations</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {(impact.recommendations ?? []).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
