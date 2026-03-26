import { NextRequest, NextResponse } from 'next/server'
import { acknowledgeAlert } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: number }

  if (!body.id) {
    return NextResponse.json({ error: 'Alert id is required.' }, { status: 400 })
  }

  await acknowledgeAlert(body.id)
  return NextResponse.json({ ok: true })
}
