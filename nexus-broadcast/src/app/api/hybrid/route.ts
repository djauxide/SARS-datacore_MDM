import { NextRequest, NextResponse } from 'next/server'
import { activateVirtualStudio, assignObUnit, getPlatformSnapshot } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getPlatformSnapshot()
  return NextResponse.json({
    obUnits: snapshot.obUnits,
    virtualStudios: snapshot.virtualStudios,
    mcrChains: snapshot.mcrChains,
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | { action: 'activate-studio'; studioId: number }
    | { action: 'assign-ob'; obUnitId: number; studioId: number }

  if (body.action === 'activate-studio') {
    await activateVirtualStudio(body.studioId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'assign-ob') {
    await assignObUnit(body.obUnitId, body.studioId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown hybrid action.' }, { status: 400 })
}
