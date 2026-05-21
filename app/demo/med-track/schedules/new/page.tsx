import Link from "next/link";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage() {
  const itemsResult = await pool.query(`
    select id, name, strength, form
    from medtrack.items
    where active = true
    order by name
  `);

  const items = itemsResult.rows;

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p><Link href="/demo/med-track/schedules">? Back to Schedules</Link></p>

      <h1>New Schedule</h1>

      <form method="POST" action="/demo/med-track/api/schedules">
        <p>
          <label>
            Item<br />
            <select name="item_id" required>
              <option value="">Select item...</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.strength ? `(${item.strength})` : ""}
                </option>
              ))}
            </select>
          </label>
        </p>

        <p>
          <label>
            Frequency<br />
            <select name="frequency_type" required>
              <option value="daily">Daily</option>
              <option value="specific_days">Specific Days</option>
              <option value="interval">Interval</option>
              <option value="as_needed">As Needed</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            Times, comma separated<br />
            <input name="times" placeholder="08:00, 13:00, 20:00" style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Interval Hours<br />
            <input name="interval_hours" type="number" min="1" style={{ width: 100 }} />
          </label>
        </p>

        <p>
          <label>
            Instructions<br />
            <textarea name="instructions" rows={4} style={{ width: 400 }} />
          </label>
        </p>

        <button type="submit">Save Schedule</button>
      </form>
    </main>
  );
}