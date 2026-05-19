import { NextRequest, NextResponse } from 'next/server'
import { runExecutiveNlpQuery } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { query?: string }
  return NextResponse.json(await runExecutiveNlpQuery(body))
}

