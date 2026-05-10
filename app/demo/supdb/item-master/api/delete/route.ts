import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = String(searchParams.get("uid") ?? "").trim();
  if (!uid) return new Response("uid is required", { status: 400 });

  await pool.query(`DELETE FROM cdm.item_master WHERE uid = $1`, [uid]);

  return Response.redirect(new URL(`/demo/supdb/item-master`, request.url), 303);
}