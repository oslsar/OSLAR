import Link from 'next/link'
import NewItemForm from './new-item-form'

export default function MedTrackNewItemPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Med Tracker - New Item</h1>

      <div style={{ marginBottom: 16 }}>
        <Link href="/demo/med-track/today">← Back to Today</Link>
      </div>

      <NewItemForm />
    </main>
  )
}