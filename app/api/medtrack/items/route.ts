import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = '11111111-1111-1111-1111-111111111111'

    if (!body?.name || !body?.kind) {
      return NextResponse.json(
        { ok: false, error: 'name and kind are required' },
        { status: 400 }
      )
    }

    const kind = String(body.kind).trim().toLowerCase()

    if (!['supplement', 'medicine'].includes(kind)) {
      return NextResponse.json(
        { ok: false, error: `invalid kind: ${body.kind}` },
        { status: 400 }
      )
    }

    const id = crypto.randomUUID()

    await pool.query(
      `
      insert into medtrack.items
        (id, user_id, name, kind, strength, form, notes, active)
      values
        ($1, $2, $3, $4, $5, $6, $7, true)
      `,
      [
        id,
        userId,
        String(body.name).trim(),
        kind,
        body.strength ? String(body.strength).trim() : null,
        body.form ? String(body.form).trim() : null,
        body.notes ? String(body.notes).trim() : null,
      ]
    )

    return NextResponse.json({ ok: true, id })
  } catch (err: any) {
    console.error('CREATE ITEM ERROR:', err)
    return NextResponse.json(
      { ok: false, error: err.message || 'Unknown server error' },
      { status: 500 }
    )
  }
}