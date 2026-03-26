import { NextRequest, NextResponse } from 'next/server'
import { activateControlPage, getPlatformSnapshot, runControlSalvo, toggleControlPanel } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getPlatformSnapshot()
  return NextResponse.json(snapshot.controlConfig)
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | { action: 'toggle-panel'; panelId: number }
    | { action: 'activate-page'; pageId: number }
    | { action: 'run-salvo'; salvoId: number }

  if (body.action === 'toggle-panel') {
    const panel = await toggleControlPanel(body.panelId)
    return NextResponse.json({ panel })
  }

  if (body.action === 'activate-page') {
    const page = await activateControlPage(body.pageId)
    return NextResponse.json({ page })
  }

  if (body.action === 'run-salvo') {
    const salvo = await runControlSalvo(body.salvoId)
    return NextResponse.json({ salvo })
  }

  return NextResponse.json({ error: 'Unknown control config action.' }, { status: 400 })
}
