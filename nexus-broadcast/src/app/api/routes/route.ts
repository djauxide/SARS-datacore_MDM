import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot, switchRoute } from '@/lib/nexus-db'

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

  await switchRoute(body.id)
  return NextResponse.json({ ok: true })
}
