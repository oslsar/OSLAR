import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();

  const symptom = String(formData.get("symptom") || "").trim();
  const severityRaw = String(formData.get("severity") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  const severity = severityRaw ? Number(severityRaw) : null;

  await pool.query(
    `
    update medtrack.symptom_logs
    set
      symptom = $1,
      severity = $2,
      notes = $3
    where id = $4
    `,
    [symptom, severity, notes || null, id]
  );

  redirect("/demo/med-track/symptoms?success=updated");
}