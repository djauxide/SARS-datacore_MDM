import { NextRequest, NextResponse } from 'next/server'
import { askSarsCopilot, type SarsMdmModule } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { question?: string; module?: SarsMdmModule }
  return NextResponse.json(await askSarsCopilot(body))
}

