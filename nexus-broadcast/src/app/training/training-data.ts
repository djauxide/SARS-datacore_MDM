export type TrainingModule = {
  slug: string
  title: string
  duration: string
  level: string
  goal: string
  summary: string
  prerequisites: string[]
  outcomes: string[]
  steps: Array<{
    title: string
    detail: string
    checklist: string[]
  }>
  drills: string[]
}

export const trainingModules: TrainingModule[] = [
  {
    slug: 'system-startup',
    title: 'System Startup And Control Room Readiness',
    duration: '18 min',
    level: 'Foundation',
    goal: 'Bring Nexus online safely, confirm sync, and verify that the control room is ready for a production shift.',
    summary: 'Covers launch order, timing validation, health checks, and operator sign-on before the first source is taken to air.',
    prerequisites: ['Access to the Nexus web console', 'Authorized operator account', 'Primary and backup network paths connected'],
    outcomes: ['Confirm that PTP, NMOS, and route protection are healthy', 'Validate preview and program buses before a show', 'Know exactly when to escalate before going live'],
    steps: [
      {
        title: 'Open the control surface',
        detail: 'Launch the web console, sign in, and confirm the top status banner shows current clock sync and the expected operating mode.',
        checklist: ['Confirm the local time in the header matches facility reference', 'Verify the dashboard opens in `steady` mode', 'Check that no critical alert is unacknowledged before proceeding'],
      },
      {
        title: 'Validate timing and discovery',
        detail: 'Before touching routing, confirm that PTP sync and NMOS discovery are healthy so the fabric state reflects reality.',
        checklist: ['Check PTP offset on the KPI cards', 'Read the compliance panel for any AMWA NMOS or IEEE 1588 exceptions', 'If Nairobi or remote edges are degraded, arm backup paths before loading sources'],
      },
      {
        title: 'Prepare preview and program',
        detail: 'Load a safe preview source first, then verify a controlled take to air path before the actual broadcast starts.',
        checklist: ['Load a low-risk source such as bars or a standby feed to preview', 'Confirm the preview tile updates immediately', 'Perform one dry-run swap between preview and program if the schedule allows'],
      },
    ],
    drills: ['Simulate a cold start with one degraded edge device and document the escalation path.', 'Practice a pre-flight check in under five minutes without skipping route protection validation.'],
  },
  {
    slug: 'live-routing',
    title: 'Live Routing, Source Selection, And Multiview Operations',
    duration: '24 min',
    level: 'Core Ops',
    goal: 'Teach operators how to select sources, load preview, take program, and watch the multiview like a director and a transmission engineer.',
    summary: 'Focuses on the pressable source tiles, live session indicators, transport formats, and safe on-air switching habits.',
    prerequisites: ['Completed startup training', 'At least one active contribution or studio source'],
    outcomes: ['Take sources to air with confidence', 'Interpret source state and active session indicators', 'Recognize when a feed should stay on preview instead of going live'],
    steps: [
      {
        title: 'Read the feed tiles',
        detail: 'Each pressable tile carries location, format, audience sessions, and a live or attention state that should influence switching decisions.',
        checklist: ['Prefer `live` feeds for direct takes', 'Treat `attention` feeds as preview-only until their telemetry improves', 'Use viewer/session counts to understand which operator pods are monitoring a source'],
      },
      {
        title: 'Load to preview first',
        detail: 'Preview is the operator safety buffer. Every route change should hit preview before it reaches program unless emergency policy says otherwise.',
        checklist: ['Select a feed tile', 'Use `Load to preview` and confirm the preview label changes', 'Watch the event log to confirm the action was recorded'],
      },
      {
        title: 'Take to air intentionally',
        detail: 'Only take to program after preview confidence is established. Program should remain predictable and logged at all times.',
        checklist: ['Use `Take to air` for the selected feed', 'Confirm program changes on the KPI card and simulation panel', 'If a mistaken take occurs, use `Swap program / preview` immediately to revert'],
      },
    ],
    drills: ['Rehearse switching between Studio 1, Contribution, and FAST Output in a timed three-source rotation.', 'Run a segment where one source remains in warning state and keep it out of program.'],
  },
  {
    slug: 'automation-runbooks',
    title: 'Automation Runbooks And Recovery Workflows',
    duration: '21 min',
    level: 'Advanced Ops',
    goal: 'Use the built-in runbooks to recover services, launch cloud capacity, and reduce operator reaction time during pressure.',
    summary: 'Explains when to trust automation, how to observe runbook state changes, and how to confirm a successful recovery.',
    prerequisites: ['Comfort with routing and device panels', 'Understanding of your facility escalation policy'],
    outcomes: ['Run failover safely', 'Monitor automation progression from idle to complete', 'Validate recovery with alerts, route state, and the event log'],
    steps: [
      {
        title: 'Choose the right runbook',
        detail: 'Runbooks are not interchangeable. Select the automation that matches the operational problem instead of launching everything at once.',
        checklist: ['Use `Auto Failover` for path instability', 'Use `Cloud Burst Spin-up` when capacity is constrained', 'Use `FAST Channel Launch` only when digital playout is part of the plan'],
      },
      {
        title: 'Observe the state transition',
        detail: 'Every automation moves through visible UI states. Operators must confirm this transition before assuming the system has reacted.',
        checklist: ['Watch the runbook pill change to `running`', 'Confirm that a `Runbook started` event appears', 'Wait for a `Runbook completed` event before declaring success'],
      },
      {
        title: 'Verify the result',
        detail: 'A complete runbook does not matter if alerts, routes, or devices remain degraded. The post-check is operationally critical.',
        checklist: ['Check whether protected routes increased', 'Confirm degraded devices improved or backups armed', 'Acknowledge or clear related alerts after verification'],
      },
    ],
    drills: ['Trigger `Incident` mode, run recovery, and document how many UI signals confirm success.', 'Practice using one runbook while ignoring the others to avoid operator overreaction.'],
  },
  {
    slug: 'incident-response',
    title: 'Incident Response, Protection Modes, And Escalation',
    duration: '28 min',
    level: 'Critical Ops',
    goal: 'Train teams to stabilize the system during transport instability, sync drift, or protection-path loss.',
    summary: 'Uses the incident simulation mode to practice detecting symptoms, containing damage, restoring protection, and escalating with clarity.',
    prerequisites: ['Completed the first three modules', 'Understands local fault reporting process'],
    outcomes: ['Identify the earliest warning signs of instability', 'Use `Auto recover` and manual controls together', 'Communicate status using the event log and alert cards'],
    steps: [
      {
        title: 'Enter incident mode deliberately',
        detail: 'The incident scenario raises jitter, sync offset, and alert severity. Use it to practice decision-making, not to panic-click the interface.',
        checklist: ['Trigger `Incident` mode', 'Watch throughput, jitter, and sync offset react within one update cycle', 'Read the newest critical alert before taking action'],
      },
      {
        title: 'Contain first, optimize later',
        detail: 'Your first task is protection, not perfection. Restore redundancy and known-good paths before trying to fine-tune every metric.',
        checklist: ['Check whether any route is still single-path', 'Arm backup on degraded devices', 'Move risky feeds to preview instead of leaving them on program'],
      },
      {
        title: 'Recover and report',
        detail: 'Run the recovery action or an appropriate runbook, then communicate what changed and what remains risky.',
        checklist: ['Use `Auto recover` when the scenario matches protection loss', 'Confirm contribution feeds return to `live` state', 'Summarize the incident using alert cards plus recent events'],
      },
    ],
    drills: ['Practice a two-minute containment drill where route protection must reach full coverage before any other optimization.', 'Run a post-incident verbal handover using only information visible in Nexus.'],
  },
  {
    slug: 'shift-handovers',
    title: 'Shift Handovers, Daily Shutdown, And Audit Discipline',
    duration: '16 min',
    level: 'Operations Hygiene',
    goal: 'Keep the next operator informed by documenting changes, acknowledgements, and current risk posture before handover or shutdown.',
    summary: 'Teaches teams to leave the platform in a predictable, traceable state at the end of a shift or event.',
    prerequisites: ['Basic familiarity with events and alerts'],
    outcomes: ['Create reliable handovers', 'Leave program and preview in intentional states', 'Use the event feed as an operational record instead of memory'],
    steps: [
      {
        title: 'Stabilize active services',
        detail: 'Do not hand over a system while it is in a noisy or half-recovered state unless the incident is still active and clearly documented.',
        checklist: ['Return simulation mode to `steady` when appropriate', 'Confirm program output is intentional', 'Make sure backups are armed where policy requires'],
      },
      {
        title: 'Clean up operator attention debt',
        detail: 'The next operator should inherit a meaningful dashboard, not a pile of stale warnings with no context.',
        checklist: ['Acknowledge alerts that have already been handled', 'Leave unresolved alerts unacknowledged if they still require action', 'Review the latest events for anything the next shift must know immediately'],
      },
      {
        title: 'Record the handover story',
        detail: 'Use what Nexus already tracks to frame the handover: current program, recent route changes, and any automations that ran.',
        checklist: ['Note the active program and preview feeds', 'Mention any completed recovery runbooks', 'Call out any remote site still in degraded state'],
      },
    ],
    drills: ['Do a mock handover after a busy event and see whether the incoming operator can understand the system in under one minute.', 'Practice leaving exactly one unresolved alert with enough context for the next shift.'],
  },
]

export function getTrainingModule(slug: string) {
  return trainingModules.find((module) => module.slug === slug)
}
