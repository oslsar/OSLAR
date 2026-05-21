import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

  const itemId = String(formData.get("item_id") || "").trim();
  const frequencyType = String(formData.get("frequency_type") || "daily").trim();
  const timesRaw = String(formData.get("times") || "").trim();
  const intervalRaw = String(formData.get("interval_hours") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();

  if (!itemId) {
    throw new Error("Item is required");
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

  const times = timesRaw
    ? timesRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : null;

  const intervalHours = intervalRaw ? Number(intervalRaw) : null;

  await pool.query(
    `
    insert into medtrack.schedules
      (id, user_id, item_id, frequency_type, times_json, interval_hours, instructions, active)
    values
      (gen_random_uuid(), $1, $2, $3, $4::jsonb, $5, $6, true)
    `,
    [
      userId,
      itemId,
      frequencyType,
      times ? JSON.stringify(times) : null,
      intervalHours,
      instructions || null,
    ]
  );

  redirect("/demo/med-track/schedules");
}