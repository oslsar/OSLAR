import Link from "next/link";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function SymptomsPage() {
  const result = await pool.query(`
    select *
    from medtrack.symptom_logs
    order by logged_at desc
    limit 100
  `);

  const symptoms = result.rows;

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/demo/med-track">← MedTrack Home</Link>
      </p>

      <h1>Symptoms</h1>

      <p>
        <Link href="/demo/med-track/symptoms/new">Log New Symptom</Link>
      </p>

      {symptoms.length === 0 ? (
        <p>No symptoms logged yet.</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>Logged At</th>
              <th>Symptom</th>
              <th>Severity</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {symptoms.map((s: any) => (
              <tr key={s.id}>
                <td>{new Date(s.logged_at).toLocaleString()}</td>
                <td>{s.symptom}</td>
                <td>{s.severity}</td>
                <td>{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
