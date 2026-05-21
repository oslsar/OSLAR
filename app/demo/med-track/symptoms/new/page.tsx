import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewSymptomPage() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/demo/med-track/symptoms">← Back to Symptoms</Link>
      </p>

      <h1>Log Symptom</h1>

      <form method="POST" action="/demo/med-track/api/symptoms">
        <p>
          <label>
            Symptom<br />
            <input name="symptom" required style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Severity 1–10<br />
            <input name="severity" type="number" min="1" max="10" style={{ width: 100 }} />
          </label>
        </p>

        <p>
          <label>
            Notes<br />
            <textarea name="notes" rows={4} style={{ width: 400 }} />
          </label>
        </p>

        <button type="submit">Save Symptom</button>
      </form>
    </main>
  );
}
