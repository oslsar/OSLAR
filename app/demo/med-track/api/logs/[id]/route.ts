import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();

  const takenAt = String(formData.get("taken_at") || "").trim();
  const status = String(formData.get("status") || "taken").trim();
  const notes = String(formData.get("notes") || "").trim();

  await pool.query(
    `
    update medtrack.dose_logs
    set
      taken_at = $1,
      status = $2,
      notes = $3
    where id = $4
    `,
    [takenAt || null, status, notes || null, id]
  );

  redirect("/demo/med-track/today");
}
