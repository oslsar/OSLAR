import { NextRequest } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pmCode = searchParams.get("code");

  if (!pmCode) {
    return Response.json({ error: "Missing pm code" }, { status: 400 });
  }

  try {
    const pmRes = await pool.query(
      `SELECT pm_code, pm_title, issue_number, in_work
       FROM s1kd_core.publication_module
       WHERE pm_code = $1`,
      [pmCode]
    );

    const tocRes = await pool.query(
      `SELECT pm_code, seq_no, parent_seq_no, entry_type, target_code, title
       FROM s1kd_view.v_pm_toc
       WHERE pm_code = $1
       ORDER BY seq_no`,
      [pmCode]
    );

    return Response.json({
      header: pmRes.rows[0] || null,
      toc: tocRes.rows,
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
