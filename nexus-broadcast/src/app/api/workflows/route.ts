import { NextRequest, NextResponse } from 'next/server'
import { getPlatformSnapshot, runWorkflow } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ workflows: (await getPlatformSnapshot()).workflows })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { id?: number }
  if (!body.id) {
    return NextResponse.json({ error: 'Workflow id is required.' }, { status: 400 })
  }

  await runWorkflow(body.id)
  return NextResponse.json({ ok: true })
}
