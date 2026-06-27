import Link from "next/link";
import { pool } from "@/lib/medtrack/db";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const itemsResult = await pool.query(`
    select id, name, strength, form
    from medtrack.items
    where active = true
    order by name
  `);

  const items = itemsResult.rows;

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
        title="New Schedule"
        backHref="/demo/med-track/schedules"
        backLabel="Back to Schedules"
      />

      <form
        method="POST"
        action="/demo/med-track/api/schedules"
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
        <label style={{ fontWeight: 600 }}>
          Item
          <select
            name="item_id"
            required
            style={fieldStyle}
          >
            <option value="">Select item...</option>

            {items.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.strength
                  ? ` (${item.strength})`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontWeight: 600 }}>
          Frequency
          <select
            name="frequency_type"
            required
            style={fieldStyle}
          >
            <option value="daily">Daily</option>
            <option value="specific_days">
              Specific Days
            </option>
            <option value="interval">
              Interval
            </option>
            <option value="as_needed">
              As Needed
            </option>
          </select>
        </label>

        <label style={{ fontWeight: 600 }}>
          Times (comma separated)
          <input
            name="times"
            placeholder="08:00, 13:00, 20:00"
            style={fieldStyle}
          />
          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginTop: 4,
            }}
          >
            Example: 08:00, 13:00, 20:00
          </div>
        </label>

	<label style={{ fontWeight: 600 }}>
          Interval Hours
          <input
            name="interval_hours"
            type="number"
            min="1"
            placeholder="e.g. 8"
            style={fieldStyle}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Used for interval schedules only
          </div>
        </label>

        <label style={{ fontWeight: 600 }}>
          Instructions
          <textarea
            name="instructions"
            rows={6}
            placeholder="Take with food, upon waking, etc."
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
          <Button
            type="submit"
            variant="success"
          >
            Save Schedule
          </Button>

          <Link href="/demo/med-track/schedules">
            Cancel
          </Link>
        </div>
      </form>
    </AppShell>
  );
}