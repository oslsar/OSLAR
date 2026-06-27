import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();

  const itemId = String(formData.get("item_id") || "").trim();
  const frequencyType = String(formData.get("frequency_type") || "daily").trim();
  const timesRaw = String(formData.get("times") || "").trim();
  const intervalRaw = String(formData.get("interval_hours") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();
  const active = formData.get("active") === "on";

  const times = timesRaw
    ? timesRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : null;

  const intervalHours = intervalRaw ? Number(intervalRaw) : null;

  await pool.query(
    `
    update medtrack.schedules
    set
      item_id = $1,
      frequency_type = $2,
      times_json = $3::jsonb,
      interval_hours = $4,
      instructions = $5,
      active = $6
    where id = $7
    `,
    [
      itemId,
      frequencyType,
      times ? JSON.stringify(times) : null,
      intervalHours,
      instructions || null,
      active,
      id,
    ]
  );

  redirect("/demo/med-track/schedules?success=updated");
}
