export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableUpper = table.toUpperCase();

  const res = await fetch(
    `http://localhost:3000/demo/api/schema?table=${encodeURIComponent(table)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Table: {tableUpper}</h1>
        <p className="mt-4 text-sm text-red-600">
          Table not found (API returned {res.status}).
        </p>
      </div>
    );
  }

  const data: { columns: { name: string; type: string; nullable: boolean }[] } =
    await res.json();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Table: {tableUpper}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Demo schema explorer (API-backed)
          </p>
        </div>

        <a
          href="/demo/browse"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to Browse
        </a>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-6 text-sm">
          <span className="border-b-2 border-gray-900 pb-2 font-medium">
            Columns
          </span>
          <span className="pb-2 text-gray-500">Constraints</span>
          <span className="pb-2 text-gray-500">Standards Mapping</span>
          <span className="pb-2 text-gray-500">Tailoring Impact</span>
        </nav>
      </div>

      {/* Columns Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Column</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Nullable</th>
            </tr>
          </thead>
          <tbody>
            {data.columns.map((col) => (
              <tr key={col.name} className="border-t border-gray-200">
                <td className="px-4 py-2 font-mono">{col.name}</td>
                <td className="px-4 py-2">{col.type}</td>
                <td className="px-4 py-2">{col.nullable ? "Yes" : "No"}</td>
              </tr>
            ))}
            {data.columns.length === 0 && (
              <tr className="border-t border-gray-200">
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={3}>
                  No columns returned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
