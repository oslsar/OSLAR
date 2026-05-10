"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TableListItem = {
  name: string;
  description?: string;
  columnCount?: number;
};

export default function Page() {
  const [tables, setTables] = useState<TableListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/demo/api/schema", { cache: "no-store" });
        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();
        const list: TableListItem[] = Array.isArray(data?.tables) ? data.tables : [];

        if (!cancelled) setTables(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load tables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tables;

    return tables.filter((t) => {
      const hay = `${t.name} ${t.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tables, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Browse</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore demo schema objects (tables)
          </p>
        </div>

        <div className="w-full sm:w-80">
          <label className="sr-only" htmlFor="q">
            Search tables
          </label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Loading tables…
          </div>
        )}

        {!loading && err && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load tables: {err}
          </div>
        )}

        {!loading && !err && (
          <>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                Showing{" "}
                <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">{tables.length}</span>
              </div>

              <Link
                href="/demo/browse/tables"
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Tables list →
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <Link
                  key={t.name}
                  href={`/demo/browse/tables/${encodeURIComponent(t.name)}`}
                  className="group rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t.name}
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {t.description ?? "No description yet."}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs text-gray-400 group-hover:text-gray-600">
                      Open →
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Columns:{" "}
                    <span className="font-medium text-gray-700">
                      {t.columnCount ?? "—"}
                    </span>
                  </div>
                </Link>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 sm:col-span-2 lg:col-span-3">
                  No tables match your search.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
