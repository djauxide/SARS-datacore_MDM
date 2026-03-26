import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot, queueConnectorJob, switchRoute } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ routes: (await getPlatformSnapshot()).routes })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: number }
  if (!body.id) {
    return NextResponse.json({ error: 'Route id is required.' }, { status: 400 })
  }

  const snapshot = await getPlatformSnapshot()
  const route = snapshot.routes.find((item) => item.id === body.id)
  const connector = snapshot.connectors.find((item) => item.name === route?.controller)
  if (connector) {
    await queueConnectorJob(connector.id, 'switch-route', { routeId: body.id })
  }
  await switchRoute(body.id)
  return NextResponse.json({ ok: true })
}
