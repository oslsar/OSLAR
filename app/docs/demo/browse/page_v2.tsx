export default function Page() {
  const tables = [
    { name: "xa", description: "Provisioning data" },
    { name: "ha", description: "Item master" },
    { name: "tha", description: "Task relationships" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Browse Tables</h1>
        <input
          placeholder="Search tables..."
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <a
            key={t.name}
            href={`/demo/browse/tables/${t.name}`}
            className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t.name}
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {t.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
