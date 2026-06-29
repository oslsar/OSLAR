import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();
  
  const name = String(formData.get("name") || "").trim();
  const kind = String(formData.get("kind") || "").trim();
  const strength = String(formData.get("strength") || "").trim();
  const itemForm = String(formData.get("form") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const active = formData.get("active") === "on";

  await pool.query(
    `
    INSERT INTO medtrack.items
      (name, kind, strength, form, notes, active)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    `,
    [
      name,
      kind,
      strength || null,
      itemForm || null,
      notes || null,
      active,
    ]
  );
  
  redirect("/demo/med-track/admin/items?success=created");
}