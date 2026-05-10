type MappingRow = {
  column: string;
  geia?: { entity: string; attribute: string };
  mil?: { table: string; field: string; ded?: string };
  matchType: "exact" | "ded" | "heuristic" | "none";
};

type Mapping = { table: string; rows: MappingRow[] };

export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  const res = await fetch(
    `http://localhost:3000/demo/api/mapping?table=${encodeURIComponent(table)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        No mapping data found for this table (demo).
      </div>
    );
  }

  const data: Mapping = await res.json();
  const rows = data.rows ?? [];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Column</th>
            <th className="px-4 py-2 font-medium">GEIA</th>
            <th className="px-4 py-2 font-medium">MIL</th>
            <th className="px-4 py-2 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.column} className="border-t border-gray-200">
              <td className="px-4 py-2 font-mono text-xs">{row.column}</td>

              <td className="px-4 py-2">
                {row.geia ? (
                  <div className="text-xs">
                    <div className="font-medium text-gray-800">{row.geia.entity}</div>
                    <div className="text-gray-500">{row.geia.attribute}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              <td className="px-4 py-2">
                {row.mil ? (
                  <div className="text-xs">
                    <div className="font-medium text-gray-800">
                      {row.mil.table}.{row.mil.field}
                    </div>
                    {row.mil.ded ? (
                      <div className="text-gray-500">{row.mil.ded}</div>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              <td className="px-4 py-2">
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                  {row.matchType}
                </span>
              </td>
            </tr>
          ))}

          {!rows.length && (
            <tr className="border-t border-gray-200">
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                No mapping rows for this table (demo).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
