import { NextRequest, NextResponse } from 'next/server'
import { applyProductionSetup, listProductionSetups, saveProductionSetup } from '@/lib/nexus-db'
import type { ProductionSetupRecord } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await listProductionSetups())
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | { action: 'apply'; id: number }
    | ({ action: 'save' } & (Omit<ProductionSetupRecord, 'id'> & { id?: number }))

  if (body.action === 'apply') {
    const production = await applyProductionSetup(body.id)
    return NextResponse.json({ production })
  }

  if (body.action === 'save') {
    const { action: _action, ...payload } = body
    const production = await saveProductionSetup(payload)
    return NextResponse.json({ production })
  }

  return NextResponse.json({ error: 'Unknown production action.' }, { status: 400 })
}
