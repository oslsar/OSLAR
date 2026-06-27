import { redirect } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await pool.query(
    `
    delete from medtrack.dose_logs
    where id = $1
    `,
    [id]
  );

  redirect("/demo/med-track/admin/dose-logs?success=deleted");
}
