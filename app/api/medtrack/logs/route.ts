import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const userId = '11111111-1111-1111-1111-111111111111'

  if (!body?.item_id || !body?.status) {
    return NextResponse.json(
      { ok: false, error: 'item_id and status are required' },
      { status: 400 }
    )
  }

  const allowed = ['taken', 'skipped', 'missed']
  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      { ok: false, error: 'invalid status' },
      { status: 400 }
    )
  }

  const id = crypto.randomUUID()

  await pool.query(
    `
    insert into medtrack.dose_logs
      (id, user_id, item_id, scheduled_at, taken_at, status, dose_amount, notes)
    values
      ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      id,
      userId,
      body.item_id,
      body.scheduled_at ?? null,
      body.status === 'taken' ? new Date().toISOString() : null,
      body.status,
      body.dose_amount ?? null,
      body.notes ?? null,
    ]
  )

  return NextResponse.json({ ok: true, id })
}