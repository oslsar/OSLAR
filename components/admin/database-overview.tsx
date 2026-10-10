type PgStats = {
  container: string;
  version: string;
  size: string;
  connections: string;
  schemas: string;
  tables: string;
  indexes: string;
};

export default function DatabaseOverview({
  development,
  production,
}: {
  development: PgStats;
  production: PgStats;
}) {
  const shortVersion = (version: string) =>
    version.split(" on ")[0] || version;

  const databases: [string, PgStats][] = [
    ["Development", development],
    ["Production", production],
  ];

  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">PostgreSQL Overview</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {databases.map(([label, db]) => (
          <div key={label} className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 text-lg font-semibold">{label}</div>
            <div className="text-sm text-gray-600">{db.container}</div>

            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="font-semibold">Version: </span>{shortVersion(db.version)}</div>
              <div><span className="font-semibold">Database size: </span>{db.size || "-"}</div>
              <div><span className="font-semibold">Connections: </span>{db.connections || "-"}</div>
              <div><span className="font-semibold">Schemas: </span>{db.schemas || "-"}</div>
              <div><span className="font-semibold">Tables: </span>{db.tables || "-"}</div>
              <div><span className="font-semibold">Indexes: </span>{db.indexes || "-"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
