import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

  const itemId = String(formData.get("item_id") || "").trim();
  const status = String(formData.get("status") || "taken").trim();

  if (!itemId) {
    throw new Error("Item ID required");
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
    insert into medtrack.dose_logs
      (
        id,
        user_id,
        item_id,
        taken_at,
        status
      )
    values
      (
        gen_random_uuid(),
        $1,
        $2,
        now(),
        $3
      )
    `,
    [userId, itemId, status]
  );

  redirect("/demo/med-track/today");
}
