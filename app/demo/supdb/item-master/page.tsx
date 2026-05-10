import { pool } from "@/lib/db";
import Link from "next/link";

type SearchParams = {
  q?: string;
  page?: string;
  limit?: string;
  sort?: string;
  dir?: string; // "asc" | "desc"
};

export const dynamic = "force-dynamic"; // demo: always fresh

function toInt(v: string | undefined, def: number, min: number, max: number) {
  const n = Number.parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const limit = toInt(sp.limit, 100, 1, 1000);
  const page = toInt(sp.page, 1, 1, 100000);
  const offset = (page - 1) * limit;

  // Filtering
  const where = q ? `WHERE CAST(im AS text) ILIKE $1` : "";
  const params: any[] = [];
  if (q) params.push(`%${q}%`);
  params.push(limit, offset);

  // Bootstrap once to get column names (for safe sort validation)
  const bootstrapSql = `
    SELECT im.*
    FROM cdm.item_master im
    ${where}
    ORDER BY 1
    LIMIT $${q ? 2 : 1}
    OFFSET $${q ? 3 : 2}
  `;
  const bootstrap = await pool.query(bootstrapSql, params);
  const columns = bootstrap.rows[0] ? Object.keys(bootstrap.rows[0]) : [];

  // Sort handling (safe)
  const requestedSort = sp.sort;
  const dirSql = sp.dir === "desc" ? "DESC" : "ASC";

  // Default sort prefers item_code
  const defaultSort = columns.includes("item_code")
    ? "item_code"
    : (columns[0] ?? "1");

  // Only allow sorting by real columns (prevents SQL injection)
  const allowedSort =
    requestedSort && columns.includes(requestedSort)
      ? requestedSort
      : defaultSort;

  const sql = `
    SELECT im.*
    FROM cdm.item_master im
    ${where}
    ORDER BY ${allowedSort} ${dirSql}
    LIMIT $${q ? 2 : 1}
    OFFSET $${q ? 3 : 2}
  `;

  const { rows } = await pool.query(sql, params);

  const hasPrev = page > 1;
  const hasNext = rows.length === limit; // demo logic

  const thStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    background: "#f5f5f5",
    padding: "6px 8px",
    textAlign: "left",
    position: "sticky",
    top: 0,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    padding: "6px 8px",
    whiteSpace: "nowrap",
  };

  function nextDirFor(col: string) {
    // If clicking same column, toggle direction; otherwise default asc
    if (allowedSort === col) return dirSql === "ASC" ? "desc" : "asc";
    return "asc";
  }

  const downloadHref = `/demo/supdb/item-master/export?q=${encodeURIComponent(
    q
  )}&sort=${encodeURIComponent(allowedSort)}&dir=${encodeURIComponent(
    sp.dir ?? "asc"
  )}`;

  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2>Supdb (Supportability db) — cdm.item_master</h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <form
          method="GET"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="search…"
            style={{ padding: 8, minWidth: 280 }}
          />
          <input
            name="limit"
            defaultValue={String(limit)}
            style={{ padding: 8, width: 100 }}
          />
          <input
            name="page"
            defaultValue={String(page)}
            style={{ padding: 8, width: 100 }}
          />

          {/* preserve sort/dir when submitting form */}
          <input type="hidden" name="sort" value={allowedSort} />
          <input type="hidden" name="dir" value={sp.dir ?? "asc"} />

          <button type="submit" style={{ padding: "8px 12px" }}>
            Go
          </button>
        </form>

        <Link
          href="/demo/supdb/item-master/new"
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            textDecoration: "none",
            fontSize: 14,
          }}
          title="Create a new item"
        >
          + New Item
        </Link>

        {/* CSV download handled by: app/demo/supdb/item-master/export/route.ts */}
        <a
          href={downloadHref}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            textDecoration: "none",
            fontSize: 14,
          }}
          title="Download all matching rows as CSV"
        >
          Download CSV
        </a>
      </div>

      <div style={{ marginBottom: 8, color: "#666", fontSize: 12 }}>
        Showing {rows.length} rows (page {page}, limit {limit})
        {columns.length > 0 && (
          <>
            {" "}
            — sorted by <b>{allowedSort}</b> {dirSql === "ASC" ? "▲" : "▼"}
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <p>No rows found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}
          >
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} style={thStyle}>
                    <Link
                      href={{
                        pathname: "/demo/supdb/item-master",
                        query: {
                          q,
                          limit,
                          page,
                          sort: c,
                          dir: nextDirFor(c),
                        },
                      }}
                      style={{ textDecoration: "underline" }}
                      title="Sort"
                    >
                      {c}
                      {allowedSort === c
                        ? dirSql === "ASC"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i}>
                  {columns.map((c) => {
                    const val = r[c];

                    // Make item_code clickable, but route by uid (the real key)
                    if (c === "item_code") {
                      const uid = r.uid;
                      return (
                        <td key={c} style={tdStyle}>
                          <Link
                            href={`/demo/supdb/item-master/${encodeURIComponent(
                              String(uid)
                            )}`}
                            style={{ textDecoration: "underline" }}
                            title={`Edit uid=${uid}`}
                          >
                            {val === null || val === undefined ? "" : String(val)}
                          </Link>
                        </td>
                      );
                    }

                    return (
                      <td key={c} style={tdStyle}>
                        {val === null || val === undefined ? "" : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {hasPrev ? (
          <Link
            href={{
              pathname: "/demo/supdb/item-master",
              query: {
                q,
                limit,
                page: page - 1,
                sort: allowedSort,
                dir: sp.dir ?? "asc",
              },
            }}
            style={{ textDecoration: "underline" }}
          >
            ← Prev
          </Link>
        ) : (
          <span style={{ color: "#999" }}>← Prev</span>
        )}

        <span style={{ fontWeight: 600 }}>Page {page}</span>

        {hasNext ? (
          <Link
            href={{
              pathname: "/demo/supdb/item-master",
              query: {
                q,
                limit,
                page: page + 1,
                sort: allowedSort,
                dir: sp.dir ?? "asc",
              },
            }}
            style={{ textDecoration: "underline" }}
          >
            Next →
          </Link>
        ) : (
          <span style={{ color: "#999" }}>Next →</span>
        )}
      </div>
    </main>
  );
}