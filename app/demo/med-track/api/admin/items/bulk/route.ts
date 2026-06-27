import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(request: Request) {
  const formData = await request.formData();

  const action = String(formData.get("action") || "");
  const ids = formData.getAll("item_ids").map(String);

  if (ids.length === 0) {
    redirect("/demo/med-track/admin/items?error=no-selection");
  }

  if (action === "activate") {
    await pool.query(
      `update medtrack.items set active = true where id = any($1::uuid[])`,
      [ids]
    );
  }

  if (action === "deactivate") {
    await pool.query(
      `update medtrack.items set active = false where id = any($1::uuid[])`,
      [ids]
    );
  }

  if (action === "delete") {
    await pool.query(
      `delete from medtrack.items where id = any($1::uuid[])`,
      [ids]
    );
  }

  redirect("/demo/med-track/admin/items?success=bulk-updated");
}
