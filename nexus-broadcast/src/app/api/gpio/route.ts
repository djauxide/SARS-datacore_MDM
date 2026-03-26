import { NextRequest, NextResponse } from 'next/server'
import { toggleGpio } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: number }

  if (!body.id) {
    return NextResponse.json({ error: 'GPIO id is required.' }, { status: 400 })
  }

  toggleGpio(body.id)
  return NextResponse.json({ ok: true })
}
