import Link from "next/link";

type Column = { name: string; type: string; nullable: boolean };

type TableDetails = {
  name: string;
  description?: string;
  columns: Column[];
};

type Constraints = {
  table: string;
  primaryKey?: string[];
  foreignKeys?: { column: string; references: string }[];
  checks?: string[];
  indexes?: string[];
};

type MappingRow = {
  column: string;
  geia?: { entity: string; attribute: string };
  mil?: { table: string; field: string; ded?: string };
  matchType: "exact" | "ded" | "heuristic" | "none";
};

type Mapping = { table: string; rows: MappingRow[] };

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "border-b-2 border-gray-900 pb-2 font-medium text-gray-900"
          : "pb-2 text-gray-500 hover:text-gray-900"
      }
    >
      {children}
    </Link>
  );
}

type SP = { tab?: string };

// ✅ supports BOTH: searchParams object OR Promise (Next 16 variants)
async function unwrapSearchParams(searchParams: unknown): Promise<SP> {
  if (!searchParams) return {};
  if (typeof (searchParams as any).then === "function") {
    return (await (searchParams as Promise<SP>)) ?? {};
  }
  return (searchParams as SP) ?? {};
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams?: SP | Promise<SP>;
}) {
  const { table } = await params;
  const sp = await unwrapSearchParams(searchParams);
  const tab = (sp.tab ?? "columns").toLowerCase();

  const res = await fetch(
    `http://localhost:3000/demo/api/schema?table=${encodeURIComponent(table)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Table: {table.toUpperCase()}</h1>
        <p className="mt-4 text-sm text-red-600">
          Table not found (API returned {res.status}).
        </p>
      </div>
    );
  }

  const data: TableDetails = await res.json();
  const base = `/demo/browse/tables/${encodeURIComponent(data.name)}`;

  let constraints: Constraints | null = null;
  let mapping: Mapping | null = null;

  if (tab === "constraints") {
    const cRes = await fetch(
      `http://localhost:3000/demo/api/constraints?table=${encodeURIComponent(
        data.name
      )}`,
      { cache: "no-store" }
    );
    constraints = cRes.ok ? await cRes.json() : null;
  }

  if (tab === "mapping") {
    const mRes = await fetch(
      `http://localhost:3000/demo/api/mapping?table=${encodeURIComponent(
        data.name
      )}`,
      { cache: "no-store" }
    );
    mapping = mRes.ok ? await mRes.json() : null;
  }

  return (
    <div>
      {/* ✅ DEBUG (remove later) */}
      <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
        debug: tab={tab} (url ?tab={sp.tab ?? "∅"})
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Table: {data.name.toUpperCase()}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data.description ?? "No description yet."}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Columns:{" "}
            <span className="font-medium text-gray-700">{data.columns.length}</span>
          </div>
        </div>

        <Link
          href="/demo/browse"
          className="w-fit rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to Browse
        </Link>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-6 text-sm">
          <TabLink href={`${base}?tab=columns`} active={tab === "columns"}>
            Columns
          </TabLink>
          <TabLink href={`${base}?tab=constraints`} active={tab === "constraints"}>
            Constraints
          </TabLink>
          <TabLink href={`${base}?tab=mapping`} active={tab === "mapping"}>
            Standards Mapping
          </TabLink>
          <TabLink href={`${base}?tab=tailoring`} active={tab === "tailoring"}>
            Tailoring Impact
          </TabLink>
        </nav>
      </div>

      {tab === "columns" && (
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
            </tbody>
          </table>
        </div>
      )}

      {tab === "constraints" && (
        <div className="mt-6 space-y-4">
          {!constraints ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              No constraints found for this table (demo).
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold">Primary Key</div>
                <div className="mt-2 text-sm text-gray-700">
                  {constraints.primaryKey?.length
                    ? constraints.primaryKey.map((c) => (
                        <span
                          key={c}
                          className="mr-2 inline-block rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800"
                        >
                          {c}
                        </span>
                      ))
                    : "—"}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold">Foreign Keys</div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  {constraints.foreignKeys?.length ? (
                    constraints.foreignKeys.map((fk) => (
                      <div key={fk.column} className="flex gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          {fk.column}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="font-mono text-xs text-gray-800">
                          {fk.references}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div>—</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold">Checks</div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  {constraints.checks?.length ? (
                    constraints.checks.map((c) => (
                      <div key={c} className="font-mono text-xs">
                        {c}
                      </div>
                    ))
                  ) : (
                    <div>—</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold">Indexes</div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  {constraints.indexes?.length ? (
                    constraints.indexes.map((i) => (
                      <div key={i} className="font-mono text-xs">
                        {i}
                      </div>
                    ))
                  ) : (
                    <div>—</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "mapping" && (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
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
              {(mapping?.rows ?? []).map((row) => (
                <tr key={row.column} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-mono">{row.column}</td>
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
                        <div className="text-gray-500">{row.mil.ded ?? ""}</div>
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

              {!mapping?.rows?.length && (
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>
                    No mapping data for this table (demo).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tailoring" && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Tailoring impact view coming next.
        </div>
      )}
    </div>
  );
}
