'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DoseButton({
  itemId,
  status,
  label,
}: {
  itemId: string
  status: 'taken' | 'skipped'
  label: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    setBusy(true)

    const res = await fetch('/api/medtrack/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        status,
      }),
    })

    setBusy(false)

    if (!res.ok) {
      alert('Could not save log')
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #999',
        cursor: 'pointer',
      }}
    >
      {busy ? 'Saving...' : label}
    </button>
  )
}