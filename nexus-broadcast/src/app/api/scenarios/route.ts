import { NextRequest, NextResponse } from 'next/server'
import { triggerScenario } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { slug?: string }

  if (!body.slug) {
    return NextResponse.json({ error: 'Scenario slug is required.' }, { status: 400 })
  }

  await triggerScenario(body.slug)
  return NextResponse.json({ ok: true })
}
