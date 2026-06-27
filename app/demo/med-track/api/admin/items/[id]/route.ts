import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const kind = String(formData.get("kind") || "").trim();
  const strength = String(formData.get("strength") || "").trim();
  const form = String(formData.get("form") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const active = formData.get("active") === "on";

  await pool.query(
    `
    update medtrack.items
    set
      name = $1,
      kind = $2,
      strength = $3,
      form = $4,
      notes = $5,
      active = $6
    where id = $7
    `,
    [
      name,
      kind,
      strength || null,
      form || null,
      notes || null,
      active,
      id,
    ]
  );

  redirect("/demo/med-track/admin/items?success=updated");
}
