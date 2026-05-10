import { pool } from "@/lib/db";

function escapeCsv(val: any) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = (searchParams.get("q") ?? "").trim();
  const requestedSort = (searchParams.get("sort") ?? "").trim();
  const dirSql = searchParams.get("dir") === "desc" ? "DESC" : "ASC";

  // Allowlist columns (prevents SQL injection in ORDER BY)
  const colRes = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'cdm'
      AND table_name = 'item_master'
    ORDER BY ordinal_position
    `
  );
  const columns: string[] = colRes.rows.map((r: any) => r.column_name);

  const defaultSort = columns.includes("item_code")
    ? "item_code"
    : (columns[0] ?? "item_code");

  const allowedSort = columns.includes(requestedSort) ? requestedSort : defaultSort;

  const where = q ? `WHERE CAST(im AS text) ILIKE $1` : "";
  const params: any[] = [];
  if (q) params.push(`%${q}%`);

  const sql = `
    SELECT im.*
    FROM cdm.item_master im
    ${where}
    ORDER BY ${allowedSort} ${dirSql}
  `;

  const { rows } = await pool.query(sql, params);

  const outCols = rows.length > 0 ? Object.keys(rows[0]) : columns;

  const header = outCols.join(",");
  const body = rows
    .map((r: any) => outCols.map((c) => escapeCsv(r[c])).join(","))
    .join("\n");

  const csv = header + "\n" + body + (body ? "\n" : "");

  const safeSort = String(allowedSort).replace(/[^a-zA-Z0-9_]+/g, "_");
  const safeDir = dirSql === "DESC" ? "desc" : "asc";
  const fileName = `supdb_item_master_${safeSort}_${safeDir}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
