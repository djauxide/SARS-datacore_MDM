import { NextRequest, NextResponse } from 'next/server'
import {
  activateControlPage,
  getPlatformSnapshot,
  runControlSalvo,
  saveControlPage,
  saveControlSalvo,
  toggleControlPanel,
  toggleTallyMode,
} from '@/lib/nexus-db'
import type { ControlPageRecord, SalvoRecord } from '@/lib/types'

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
    | { action: 'save-page'; page: ControlPageRecord }
    | { action: 'save-salvo'; salvo: SalvoRecord }
    | { action: 'toggle-tally'; tallyId: number; mode: 'program' | 'preview' }

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

  if (body.action === 'save-page') {
    const page = await saveControlPage(body.page)
    return NextResponse.json({ page })
  }

  if (body.action === 'save-salvo') {
    const salvo = await saveControlSalvo(body.salvo)
    return NextResponse.json({ salvo })
  }

  if (body.action === 'toggle-tally') {
    const tally = await toggleTallyMode(body.tallyId, body.mode)
    return NextResponse.json({ tally })
  }

  return NextResponse.json({ error: 'Unknown control config action.' }, { status: 400 })
}
