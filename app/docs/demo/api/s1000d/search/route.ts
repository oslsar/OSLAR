import { NextRequest } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 25), 100);

  if (!q) {
    return Response.json({ results: [] });
  }

  try {
    const res = await pool.query(
      `SELECT dm_code AS code,
              COALESCE(info_name, tech_name, dm_code) AS title,
              'dm'::text AS result_type
       FROM s1kd_core.data_module
       WHERE dm_code ILIKE $1
          OR info_name ILIKE $1
          OR tech_name ILIKE $1
       ORDER BY dm_code
       LIMIT $2`,
      [`%${q}%`, limit]
    );

    return Response.json({ results: res.rows });
  } catch (err: any) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
