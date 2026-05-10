export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  const res = await fetch(
    `http://localhost:3000/demo/api/constraints?table=${table}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return <div>No constraints found.</div>;
  }

  const data = await res.json();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold">Primary Key</div>
        <div className="mt-2 text-sm text-gray-700">
          {data.primaryKey?.join(", ") ?? "—"}
        </div>
      </div>
    </div>
  );
}
