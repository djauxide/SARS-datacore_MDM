import { NextRequest, NextResponse } from 'next/server'
import {
  getPlatformSnapshot,
  runOrchestrateMacro,
  runOrchestrateWorkflow,
  setOrchestrateCloudMode,
  toggleOrchestrateRule,
  toggleOrchestrateSchedule,
} from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getPlatformSnapshot()
  return NextResponse.json(snapshot.orchestrate)
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | { action: 'run-workflow'; workflowId: number }
    | { action: 'run-macro'; macroId: number }
    | { action: 'toggle-rule'; ruleId: number }
    | { action: 'toggle-schedule'; scheduleId: number }
    | { action: 'set-cloud-mode'; mode: 'on-prem' | 'hybrid' | 'cloud' }

  if (body.action === 'run-workflow') {
    const workflow = await runOrchestrateWorkflow(body.workflowId)
    return NextResponse.json({ workflow })
  }

  if (body.action === 'run-macro') {
    const macro = await runOrchestrateMacro(body.macroId)
    return NextResponse.json({ macro })
  }

  if (body.action === 'toggle-rule') {
    const rule = await toggleOrchestrateRule(body.ruleId)
    return NextResponse.json({ rule })
  }

  if (body.action === 'toggle-schedule') {
    const schedule = await toggleOrchestrateSchedule(body.scheduleId)
    return NextResponse.json({ schedule })
  }

  if (body.action === 'set-cloud-mode') {
    const mode = await setOrchestrateCloudMode(body.mode)
    return NextResponse.json({ mode })
  }

  return NextResponse.json({ error: 'Unknown orchestrate action.' }, { status: 400 })
}
