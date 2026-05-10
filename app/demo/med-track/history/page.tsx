import Link from 'next/link'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function MedTrackHistoryPage() {
  const userId = '11111111-1111-1111-1111-111111111111'

  let rows: any[] = []
  let error = ''

  try {
    const result = await pool.query(
      `
      select
        dl.id,
        dl.item_id,
        i.name as item_name,
        dl.status,
        dl.dose_amount,
        dl.notes,
        dl.created_at
      from medtrack.dose_logs dl
      join medtrack.items i
        on i.id = dl.item_id
      where dl.user_id = $1
      order by dl.created_at desc
      limit 100
      `,
      [userId]
    )

    rows = result.rows
  } catch (err: any) {
    error = err.message || 'Unknown error'
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Med Tracker - History</h1>

      <div style={{ marginBottom: 16 }}>
        <Link href="/demo/med-track/today">← Back to Today</Link>
      </div>

      {error ? (
        <pre>{error}</pre>
      ) : rows.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                border: '1px solid #ccc',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <strong>{row.item_name}</strong>
              <div>Status: {row.status}</div>
              <div>
                {new Date(row.created_at).toLocaleString('en-CA', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {row.notes ? <div>Notes: {row.notes}</div> : null}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}