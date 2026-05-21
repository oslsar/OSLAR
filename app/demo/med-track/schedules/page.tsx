import Link from "next/link";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const result = await pool.query(`
    select
      s.id,
      s.frequency_type,
      s.times_json,
      s.days_json,
      s.interval_hours,
      s.start_date,
      s.end_date,
      s.instructions,
      s.active,
      i.name,
      i.strength,
      i.form
    from medtrack.schedules s
    join medtrack.items i
      on i.id = s.item_id
    order by i.name, s.created_at desc
  `);

  const schedules = result.rows;

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/demo/med-track">? MedTrack Home</Link>
      </p>

      <h1>Schedules</h1>

      <p>
        <Link href="/demo/med-track/schedules/new">Add New Schedule</Link>
      </p>

      {schedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Strength</th>
              <th>Form</th>
              <th>Frequency</th>
              <th>Times</th>
              <th>Interval Hours</th>
              <th>Instructions</th>
              <th>Active</th>
              <th>Edit</th>
            </tr>
          </thead>

          <tbody>
            {schedules.map((s: any) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.strength}</td>
                <td>{s.form}</td>
                <td>{s.frequency_type}</td>
                <td>{s.times_json ? JSON.stringify(s.times_json) : ""}</td>
                <td>{s.interval_hours}</td>
                <td>{s.instructions}</td>
                <td>{s.active ? "Yes" : "No"}</td>
                <td>
                  <Link href={`/demo/med-track/schedules/${s.id}/edit`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}