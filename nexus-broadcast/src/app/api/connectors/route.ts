import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot, setConnectorStatus } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ connectors: getPlatformSnapshot().connectors })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: number; status?: 'connected' | 'degraded' | 'offline' }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'Connector id and status are required.' }, { status: 400 })
  }

  setConnectorStatus(body.id, body.status)
  return NextResponse.json({ ok: true })
}
