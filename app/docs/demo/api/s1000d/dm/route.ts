import { NextRequest } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dmCode = searchParams.get("code");

  if (!dmCode) {
    return Response.json({ error: "Missing dm code" }, { status: 400 });
  }

  try {
    const headerRes = await pool.query(
      `SELECT * FROM s1kd_view.v_dm_header WHERE dm_code = $1`,
      [dmCode]
    );

    const blocksRes = await pool.query(
      `SELECT seq_no, block_type, block_json
       FROM s1kd_view.v_dm_content
       WHERE dm_code = $1
       ORDER BY seq_no`,
      [dmCode]
    );

    const refsRes = await pool.query(
      `SELECT ref_type, target_dm_code, target_fragment, raw_ref
       FROM s1kd_core.dm_ref
       WHERE source_dm_code = $1
       ORDER BY dm_ref_id`,
      [dmCode]
    );

    return Response.json({
      header: headerRes.rows[0] || null,
      blocks: blocksRes.rows,
      refs: refsRes.rows,
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
