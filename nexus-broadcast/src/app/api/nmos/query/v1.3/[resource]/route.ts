import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { resource: string } },
) {
  const snapshot = await getPlatformSnapshot()

  if (params.resource === 'nodes') {
    return NextResponse.json(snapshot.nmosNodes)
  }

  if (params.resource === 'flows') {
    return NextResponse.json(snapshot.nmosFlows)
  }

  if (params.resource === 'senders') {
    return NextResponse.json(snapshot.senders)
  }

  if (params.resource === 'receivers') {
    return NextResponse.json(snapshot.receivers)
  }

  return NextResponse.json({ error: 'Unknown NMOS query resource.' }, { status: 404 })
}
