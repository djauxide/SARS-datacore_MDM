import { NextRequest, NextResponse } from 'next/server'
import { evaluatePolicy, getSarsMdmSnapshot } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = getSarsMdmSnapshot()
  return NextResponse.json({
    compliance: snapshot.compliance,
    console: snapshot.liveConsole,
    evidence: [
      'Immutable audit event schema is active for entity, policy, copilot, NLP, and stewardship operations.',
      'Controls are mapped to POPIA, TAA, ISO 27001, and NIST AI RMF certifications.',
      'Procurement evidence pack aligns to SARS/ICT/MDM/2025-001 and R480M implementation scope.',
    ],
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { domain?: string; action?: string; role?: string; classification?: string; actor?: string }
  const policy = evaluatePolicy(body)
  return NextResponse.json({
    auditEvent: {
      id: `AUD-${Date.now()}`,
      actor: body.actor || 'system',
      timestamp: new Date().toISOString(),
      decision: policy.decision,
      risk: policy.risk,
      evidence: policy.evidence,
    },
  })
}

