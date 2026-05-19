import { NextRequest, NextResponse } from 'next/server'
import { analyseAnomalies, getSarsMdmSnapshot } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = getSarsMdmSnapshot()
  return NextResponse.json({
    generatedAt: snapshot.generatedAt,
    domains: snapshot.domains.map((domain) => analyseAnomalies({ domain: domain.domain })),
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { domain?: string; metric?: string; threshold?: number }
  return NextResponse.json({ analysis: analyseAnomalies(body) })
}

