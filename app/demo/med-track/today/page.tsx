import { pool } from '@/lib/db'
import DoseButton from './take-button'

export const dynamic = 'force-dynamic'

export default async function MedTrackTodayPage() {
  const userId = '11111111-1111-1111-1111-111111111111'

  let items: any[] = []
  let error = ''

  try {
    const result = await pool.query(
      `
      select id, name, kind, strength, form
      from medtrack.items
      where user_id = $1
      order by name asc
      `,
      [userId]
    )

    items = result.rows
  } catch (err: any) {
    error = err.message || 'Unknown error'
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Med Tracker - Today</h1>
	  <div style={{ marginBottom: 16 }}>
      <a href="/demo/med-track/history">View History</a>
      </div>
	  <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <a href="/demo/med-track/history">View History</a>
        <a href="/demo/med-track/items/new">New Item</a>
      </div>

      {error ? (
        <pre>{error}</pre>
      ) : (
        <>
          <p>✅ If you see items below, everything is wired correctly</p>

          {items.length === 0 ? (
            <p>No items found</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #ccc',
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <strong>{item.name}</strong>
                  <div>{item.kind}</div>
                  <div>{[item.strength, item.form].filter(Boolean).join(' · ')}</div>

                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <DoseButton itemId={item.id} status="taken" label="Taken" />
                    <DoseButton itemId={item.id} status="skipped" label="Skipped" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}