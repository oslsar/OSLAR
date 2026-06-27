import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/medtrack/db";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";

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

  const fieldStyle = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginTop: 6,
  };

  return (
    <AppShell current="history">
      <PageHeader
        title="Edit Dose Log"
        backHref="/demo/med-track/history"
        backLabel="Back to History"
      />

      <form
        method="POST"
        action={`/demo/med-track/api/logs/${log.id}`}
        style={{
          maxWidth: 700,
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
            Item
          </div>
          <strong>{log.name}</strong>
        </div>

        <label style={{ fontWeight: 600 }}>
          Taken At
          <input
            name="taken_at"
            type="datetime-local"
            defaultValue={takenAt}
            required
            style={fieldStyle}
          />
        </label>

        <label style={{ fontWeight: 600 }}>
          Status
          <select
            name="status"
            defaultValue={log.status}
            style={fieldStyle}
          >
            <option value="taken">Taken</option>
            <option value="skipped">Skipped</option>
          </select>
        </label>

        <label style={{ fontWeight: 600 }}>
          Notes
          <textarea
            name="notes"
            rows={6}
            defaultValue={log.notes ?? ""}
            placeholder="Optional notes..."
            style={fieldStyle}
          />
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 8,
          }}
        >
          <Button type="submit" variant="success">
            Save Changes
          </Button>

          <Link href="/demo/med-track/history">
            Cancel
          </Link>
        </div>
      </form>
    </AppShell>
  );
}