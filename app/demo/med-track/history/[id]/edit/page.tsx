import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function EditDoseLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await pool.query(
    `
    select dl.*, i.name
    from medtrack.dose_logs dl
    join medtrack.items i on i.id = dl.item_id
    where dl.id = $1
    limit 1
    `,
    [id]
  );

  const log = result.rows[0];

  if (!log) notFound();

  const takenAt = log.taken_at
    ? new Date(log.taken_at).toISOString().slice(0, 16)
    : "";

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p><Link href="/demo/med-track/today">← Back to Today</Link></p>

      <h1>Edit Dose Log</h1>

      <p><strong>{log.name}</strong></p>

      <form method="POST" action={`/demo/med-track/api/logs/${log.id}`}>
        <p>
          <label>
            Taken At<br />
            <input
              name="taken_at"
              type="datetime-local"
              defaultValue={takenAt}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Status<br />
            <select name="status" defaultValue={log.status}>
              <option value="taken">Taken</option>
              <option value="skipped">Skipped</option>
              <option value="missed">Missed</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            Notes<br />
            <textarea
              name="notes"
              rows={4}
              defaultValue={log.notes ?? ""}
              style={{ width: 400 }}
            />
          </label>
        </p>

        <button type="submit">Save Changes</button>
      </form>
    </main>
  );
}
