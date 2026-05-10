export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableName = table.toUpperCase();

  const columns = [
    { name: "id", type: "uuid", nullable: false },
    { name: "name", type: "text", nullable: false },
    { name: "created_at", type: "timestamp", nullable: false },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold">Table: {tableName}</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Column</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Nullable</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.name} className="border-t border-gray-200">
                <td className="px-4 py-2 font-mono">{col.name}</td>
                <td className="px-4 py-2">{col.type}</td>
                <td className="px-4 py-2">{col.nullable ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
