export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  const res = await fetch(
    `http://localhost:3000/demo/api/schema?table=${table}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return <div className="text-sm text-red-600">Schema not found.</div>;
  }

  const data = await res.json();

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Column</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Nullable</th>
          </tr>
        </thead>
        <tbody>
          {data.columns.map((col: any) => (
            <tr key={col.name} className="border-t border-gray-200">
              <td className="px-4 py-2 font-mono text-xs">{col.name}</td>
              <td className="px-4 py-2">{col.type}</td>
              <td className="px-4 py-2">
                {col.nullable ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
