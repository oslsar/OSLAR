import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const kind = String(formData.get("kind") || "supplement").trim();
  const strength = String(formData.get("strength") || "").trim();
  const form = String(formData.get("form") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  const userResult = await pool.query(`
    select id
    from medtrack.users
    order by created_at
    limit 1
  `);

  if (userResult.rows.length === 0) {
    throw new Error("No medtrack user found");
  }

  const userId = userResult.rows[0].id;

  await pool.query(
    `
    insert into medtrack.items
      (id, user_id, name, kind, strength, form, notes, active)
    values
      (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true)
    `,
    [userId, name, kind, strength || null, form || null, notes || null]
  );

  redirect("/demo/med-track/items");
}
