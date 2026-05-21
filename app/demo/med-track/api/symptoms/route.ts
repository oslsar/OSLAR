import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

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

  if (userResult.rows.length === 0) {
    throw new Error("No medtrack user found");
  }

  const userId = userResult.rows[0].id;

  await pool.query(
    `
    insert into medtrack.symptom_logs
      (id, user_id, symptom, severity, notes)
    values
      (gen_random_uuid(), $1, $2, $3, $4)
    `,
    [userId, symptom, severity, notes || null]
  );

  redirect("/demo/med-track/symptoms");
}
