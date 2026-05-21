import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

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

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/demo/med-track/schedules">← Back to Schedules</Link>
      </p>

      <h1>Edit Schedule</h1>

      <form method="POST" action={`/demo/med-track/api/schedules/${schedule.id}`}>
        <p>
          <label>
            Item<br />
            <select name="item_id" defaultValue={schedule.item_id} required>
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
            <select name="frequency_type" defaultValue={schedule.frequency_type} required>
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
            <input name="times" defaultValue={times} style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Interval Hours<br />
            <input
              name="interval_hours"
              type="number"
              min="1"
              defaultValue={schedule.interval_hours ?? ""}
              style={{ width: 100 }}
            />
          </label>
        </p>

        <p>
          <label>
            Instructions<br />
            <textarea
              name="instructions"
              rows={4}
              defaultValue={schedule.instructions ?? ""}
              style={{ width: 400 }}
            />
          </label>
        </p>

        <p>
          <label>
            <input type="checkbox" name="active" defaultChecked={schedule.active} /> Active
          </label>
        </p>

        <button type="submit">Save Changes</button>
      </form>
    </main>
  );
}
