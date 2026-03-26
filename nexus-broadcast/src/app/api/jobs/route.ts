import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot, queueConnectorJob } from '@/lib/nexus-db'
import type { AdapterAction } from '@/lib/adapters'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ jobs: (await getPlatformSnapshot()).jobs })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    connectorId?: number
    action?: AdapterAction
    payload?: Record<string, unknown>
  }

  if (!body.connectorId || !body.action) {
    return NextResponse.json({ error: 'connectorId and action are required.' }, { status: 400 })
  }

  const job = await queueConnectorJob(body.connectorId, body.action, body.payload ?? {})
  return NextResponse.json({ job })
}
