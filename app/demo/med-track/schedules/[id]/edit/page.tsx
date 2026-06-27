import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/medtrack/db";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";

export const dynamic = "force-dynamic";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const scheduleResult = await pool.query(
    `
    select *
    from medtrack.schedules
    where id = $1
    limit 1
    `,
    [id]
  );

  const schedule = scheduleResult.rows[0];

  if (!schedule) {
    notFound();
  }

  const itemsResult = await pool.query(`
    select id, name, strength, form
    from medtrack.items
    where active = true
    order by name
  `);

  const items = itemsResult.rows;
  const times = schedule.times_json ? schedule.times_json.join(", ") : "";

  const fieldStyle = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginTop: 6,
  };

  return (
    <AppShell current="schedules">
      <PageHeader
        title="Edit Schedule"
        backHref="/demo/med-track/schedules"
        backLabel="Back to Schedules"
      />

      <form
        method="POST"
        action={`/demo/med-track/api/schedules/${schedule.id}`}
        style={{
          maxWidth: 700,
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 24,
          display: "grid",
          gap: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <label style={{ fontWeight: 600 }}>
          Item
          <select
            name="item_id"
            defaultValue={schedule.item_id}
            required
            style={fieldStyle}
          >
            {items.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.strength ? ` (${item.strength})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontWeight: 600 }}>
          Frequency
          <select
            name="frequency_type"
            defaultValue={schedule.frequency_type}
            required
            style={fieldStyle}
          >
            <option value="daily">Daily</option>
            <option value="specific_days">Specific Days</option>
            <option value="interval">Interval</option>
            <option value="as_needed">As Needed</option>
          </select>
        </label>

        <label style={{ fontWeight: 600 }}>
          Times (comma separated)
          <input
            name="times"
            defaultValue={times}
            placeholder="08:00, 13:00, 20:00"
            style={fieldStyle}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Example: 08:00, 13:00, 20:00
          </div>
        </label>

        <label style={{ fontWeight: 600 }}>
          Interval Hours
          <input
            name="interval_hours"
            type="number"
            min="1"
            defaultValue={schedule.interval_hours ?? ""}
            placeholder="e.g. 8"
            style={fieldStyle}
          />
          <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
            Used for interval schedules only
          </div>
        </label>

        <label style={{ fontWeight: 600 }}>
          Instructions
          <textarea
            name="instructions"
            rows={6}
            defaultValue={schedule.instructions ?? ""}
            placeholder="Take with food, upon waking, etc."
            style={fieldStyle}
          />
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            name="active"
            defaultChecked={schedule.active}
          />
          Active
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 16,
          }}
        >
          <Button type="submit" variant="success">
            Save Changes
          </Button>

          <Link href="/demo/med-track/schedules">
            Cancel
          </Link>
        </div>
      </form>
    </AppShell>
  );
}