'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewItemForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [kind, setKind] = useState<'supplement' | 'medicine'>('supplement')
  const [strength, setStrength] = useState('')
  const [form, setForm] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
  
    try {
      const res = await fetch('/api/medtrack/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kind: kind.toLowerCase(),
          strength,
          form,
          notes,
        }),
      })
  
      const text = await res.text()
      let json: any = {}
  
      try {
        json = JSON.parse(text)
      } catch {
        json = { ok: false, error: text || 'Non-JSON response from server' }
      }
  
      setBusy(false)
  
      if (!res.ok || !json.ok) {
        setError(json.error || `HTTP ${res.status}`)
        return
      }
  
      router.push('/demo/med-track/today')
      router.refresh()
    } catch (err: any) {
      setBusy(false)
      setError(err.message || 'Request failed')
    }
  }  
  
  

  
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          placeholder="Vitamin D3"
          required
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as 'supplement' | 'medicine')}
          style={{ width: '100%', padding: 8 }}
        >
          <option value="supplement">Supplement</option>
          <option value="medicine">Medicine</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Strength</label>
        <input
          value={strength}
          onChange={(e) => setStrength(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          placeholder="1000 IU"
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Form</label>
        <input
          value={form}
          onChange={(e) => setForm(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          placeholder="softgel, capsule, tablet"
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 6 }}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          rows={4}
          placeholder="Take with food"
        />
      </div>

      {error ? <div style={{ color: 'red' }}>{error}</div> : null}

      <button
        type="submit"
        disabled={busy}
        style={{
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid #999',
          cursor: 'pointer',
        }}
      >
        {busy ? 'Saving...' : 'Create Item'}
      </button>
    </form>
  )
}