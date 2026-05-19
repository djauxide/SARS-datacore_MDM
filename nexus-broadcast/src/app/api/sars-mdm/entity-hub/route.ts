import { NextRequest, NextResponse } from 'next/server'
import { getSarsMdmSnapshot, resolveEntity } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = getSarsMdmSnapshot()
  return NextResponse.json({
    masterRecords: snapshot.platform.masterRecords,
    domains: snapshot.domains,
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { domain?: string; identifier?: string; attributes?: Record<string, unknown> }
  return NextResponse.json({ entity: resolveEntity(body) })
}

