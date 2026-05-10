import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

function s(form: FormData, key: string) {
  const v = form.get(key);
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const uid = randomUUID();

    const item_code = s(form, "item_code");
    if (!item_code) return new Response("item_code is required", { status: 400 });

    const name = s(form, "name");
    const nomenclature = s(form, "nomenclature");
    const item_class = s(form, "item_class"); // optional
    const uom = s(form, "uom");
    const description = s(form, "description");
    const hazard_note = s(form, "hazard_note");
    const status = s(form, "status"); // optional; can also default below
    const notes = s(form, "notes");
    const reference_set_uid = s(form, "reference_set_uid");
    const namespace_uid = s(form, "namespace_uid");

    // If you want a hard default for new records:
    const statusValue = status ?? "active"; // must be valid for cdm.status_active

    const sql = `
      INSERT INTO cdm.item_master
        (uid, item_code, name, nomenclature, item_class, uom,
         description, hazard_note, status, notes,
         reference_set_uid, namespace_uid,
         created_at, updated_at)
      VALUES
        ($1::uuid, $2, $3, $4,
         NULLIF($5,'')::cdm.item_class,
         $6, $7, $8,
         $9::cdm.status_active,
         $10,
         NULLIF($11,'')::uuid,
         NULLIF($12,'')::uuid,
         now(), now())
      RETURNING uid
    `;

    const res = await pool.query(sql, [
      uid,
      item_code,
      name,
      nomenclature,
      item_class ?? "",
      uom,
      description,
      hazard_note,
      statusValue,
      notes,
      reference_set_uid ?? "",
      namespace_uid ?? "",
    ]);

    const newUid = res.rows[0]?.uid ?? uid;

    return Response.redirect(
      new URL(`/demo/supdb/item-master/${encodeURIComponent(String(newUid))}`, request.url),
      303
    );
  } catch (err: any) {
    console.error("CREATE item_master failed:", err);
    return new Response(`CREATE failed: ${err?.message ?? String(err)}`, { status: 500 });
  }
}