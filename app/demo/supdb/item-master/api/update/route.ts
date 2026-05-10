import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = String(searchParams.get("uid") ?? "").trim();
  if (!uid) return new Response("uid required", { status: 400 });

  const form = await request.formData();

  await pool.query(
    `
    UPDATE cdm.item_master
    SET item_code = $2,
        name = $3,
        nomenclature = $4,
        uom = $5,
        description = $6,
        hazard_note = $7,
        notes = $8,
        status = $9,
        reference_set_uid = NULLIF($10, '')::uuid,
        namespace_uid = NULLIF($11, '')::uuid,
        updated_at = now()
    WHERE uid = $1
    `,
    [
      uid,
      form.get("item_code"),
      form.get("name"),
      form.get("nomenclature"),
      form.get("uom"),
      form.get("description"),
      form.get("hazard_note"),
      form.get("notes"),
      form.get("status"),
      form.get("reference_set_uid"),
      form.get("namespace_uid"),
    ]
  );

  return Response.redirect(
    new URL(`/demo/supdb/item-master/${uid}`, request.url),
    303
  );
}