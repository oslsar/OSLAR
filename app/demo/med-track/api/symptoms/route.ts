import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

  const loggedAt = String(formData.get("logged_at") || "").trim();
  const symptom = String(formData.get("symptom") || "").trim();
  const severityRaw = String(formData.get("severity") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  const severity = severityRaw ? Number(severityRaw) : null;

  if (!symptom) {
    throw new Error("Symptom is required");
  }

  const userResult = await pool.query(`
    select id
    from medtrack.users
    order by created_at
    limit 1
  `);

  const userId = userResult.rows[0].id;

  await pool.query(
    `
    insert into medtrack.symptom_logs
      (id, user_id, logged_at, symptom, severity, notes)
    values
      (gen_random_uuid(), $1, coalesce($2::timestamptz, now()), $3, $4, $5)
    `,
    [userId, loggedAt || null, symptom, severity, notes || null]
  );

  redirect("/demo/med-track/symptoms?success=saved");
}