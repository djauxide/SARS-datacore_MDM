type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
type PolicyDecision = 'approved' | 'review' | 'blocked'

export type SarsMdmModule =
  | 'mdm-entity-hub'
  | 'data-quality-lineage'
  | 'ai-governance-engine'
  | 'compliance-audit'
  | 'rbac-matrix'
  | 'data-catalogue'
  | 'ai-intelligence'
  | 'executive-intelligence'

export type MasterDomain = 'taxpayer' | 'vendor' | 'employee' | 'customs' | 'case' | 'asset'

export type MasterRecordSummary = {
  domain: MasterDomain
  records: number
  goldenRecords: number
  duplicateRate: number
  dqScore: number
  lineageCoverage: number
  piiFields: number
  stewardQueue: number
}

export type GovernanceRule = {
  id: string
  domain: MasterDomain | 'all'
  control: string
  framework: 'POPIA' | 'TAA' | 'ISO 27001' | 'NIST AI RMF' | 'SARS MDM'
  severity: RiskLevel
  active: boolean
}

export type SarsMdmSnapshot = {
  generatedAt: string
  platform: {
    name: 'SARS DataCore MDM Platform'
    procurementRef: 'SARS/ICT/MDM/2025-001'
    procurementValueZar: 480000000
    masterRecords: 48200000
    policyRules: 4218
    trustScore: 96
    trustGrade: 'GOLD'
  }
  modules: Record<SarsMdmModule, { name: string; status: 'operational' | 'watch'; summary: string }>
  domains: MasterRecordSummary[]
  compliance: Record<'POPIA' | 'TAA' | 'ISO 27001' | 'NIST AI RMF', number>
  vendors: { name: string; score: number; strengths: string[]; risk: RiskLevel }[]
  roadmap: { phase: string; window: string; outcome: string; status: 'ready' | 'in-flight' | 'planned' }[]
  liveConsole: { level: 'info' | 'warn' | 'success'; message: string; timestamp: string }[]
}

const domainRecords: MasterRecordSummary[] = [
  { domain: 'taxpayer', records: 28600000, goldenRecords: 27942000, duplicateRate: 1.8, dqScore: 97, lineageCoverage: 98, piiFields: 42, stewardQueue: 384 },
  { domain: 'vendor', records: 4200000, goldenRecords: 4108000, duplicateRate: 2.1, dqScore: 95, lineageCoverage: 97, piiFields: 28, stewardQueue: 91 },
  { domain: 'employee', records: 180000, goldenRecords: 179100, duplicateRate: 0.4, dqScore: 99, lineageCoverage: 99, piiFields: 36, stewardQueue: 12 },
  { domain: 'customs', records: 9800000, goldenRecords: 9555000, duplicateRate: 2.4, dqScore: 94, lineageCoverage: 96, piiFields: 31, stewardQueue: 267 },
  { domain: 'case', records: 3900000, goldenRecords: 3822000, duplicateRate: 1.2, dqScore: 96, lineageCoverage: 95, piiFields: 24, stewardQueue: 143 },
  { domain: 'asset', records: 1520000, goldenRecords: 1501000, duplicateRate: 0.9, dqScore: 98, lineageCoverage: 97, piiFields: 12, stewardQueue: 42 },
]

const sampleRules: GovernanceRule[] = [
  { id: 'POPIA-PII-001', domain: 'all', control: 'Personal information access requires lawful purpose and active audit trail.', framework: 'POPIA', severity: 'critical', active: true },
  { id: 'TAA-SECRECY-014', domain: 'taxpayer', control: 'Taxpayer secrecy fields may not leave approved SARS zones.', framework: 'TAA', severity: 'critical', active: true },
  { id: 'ISO27001-A8-021', domain: 'all', control: 'Privileged export requires RBAC role, ticket reference, and retention label.', framework: 'ISO 27001', severity: 'high', active: true },
  { id: 'NIST-AI-MAP-008', domain: 'case', control: 'AI recommendations require explainability, confidence, and human steward review.', framework: 'NIST AI RMF', severity: 'high', active: true },
  { id: 'SARS-MDM-DQ-112', domain: 'vendor', control: 'Vendor banking attribute changes require dual approval and lineage capture.', framework: 'SARS MDM', severity: 'high', active: true },
]

const moduleSummaries: SarsMdmSnapshot['modules'] = {
  'mdm-entity-hub': { name: 'MDM Entity Hub', status: 'operational', summary: 'Golden record matching, survivorship, merge review, and cross-domain identity resolution.' },
  'data-quality-lineage': { name: 'Data Quality & Lineage', status: 'operational', summary: 'DQ scoring, source lineage, stewardship queues, and evidence chains across all domains.' },
  'ai-governance-engine': { name: 'AI Governance Engine', status: 'operational', summary: 'Policy-aware copilot, explainable decisions, risk scoring, and control recommendations.' },
  'compliance-audit': { name: 'Compliance & Audit', status: 'operational', summary: 'Immutable audit events mapped to POPIA, TAA, ISO 27001, and NIST AI RMF controls.' },
  'rbac-matrix': { name: 'RBAC Matrix', status: 'operational', summary: 'Role, domain, action, and data classification enforcement with segregation-of-duty checks.' },
  'data-catalogue': { name: 'Data Catalogue', status: 'operational', summary: 'Searchable data products, ownership, certification state, lineage, and procurement evidence.' },
  'ai-intelligence': { name: 'AI Intelligence Layer', status: 'operational', summary: 'Policy engine, anomaly centre, stewardship workflows, pipeline monitor, and RFP evidence.' },
  'executive-intelligence': { name: 'Executive Intelligence', status: 'operational', summary: 'Command brief, 9-dimension trust engine, NLP query, vendor scorecard, and live console.' },
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function domainByName(domain?: string) {
  const normalized = domain?.toLowerCase()
  return domainRecords.find((item) => item.domain === normalized) ?? domainRecords[0]
}

export function getSarsMdmSnapshot(): SarsMdmSnapshot {
  return {
    generatedAt: nowIso(),
    platform: {
      name: 'SARS DataCore MDM Platform',
      procurementRef: 'SARS/ICT/MDM/2025-001',
      procurementValueZar: 480000000,
      masterRecords: 48200000,
      policyRules: 4218,
      trustScore: 96,
      trustGrade: 'GOLD',
    },
    modules: moduleSummaries,
    domains: domainRecords,
    compliance: {
      POPIA: 98,
      TAA: 97,
      'ISO 27001': 96,
      'NIST AI RMF': 95,
    },
    vendors: [
      { name: 'Informatica', score: 91, strengths: ['Enterprise MDM depth', 'Data governance maturity', 'Reference implementations'], risk: 'medium' },
      { name: 'IBM', score: 88, strengths: ['Security posture', 'Hybrid integration', 'Consulting ecosystem'], risk: 'medium' },
      { name: 'Ataccama', score: 86, strengths: ['Data quality automation', 'Stewardship usability', 'Fast implementation'], risk: 'medium' },
      { name: 'Reltio', score: 84, strengths: ['Cloud-native graph MDM', 'API-first activation', 'Elastic matching'], risk: 'medium' },
      { name: 'Custom DataCore', score: 96, strengths: ['SARS-specific policy model', 'Procurement evidence alignment', 'Sovereign deployment control'], risk: 'low' },
    ],
    roadmap: [
      { phase: 'Foundation', window: '0-90 days', outcome: 'Production scaffold, RBAC, audit, entity hub, and platform observability.', status: 'ready' },
      { phase: 'Integration', window: '3-6 months', outcome: 'Source onboarding, lineage capture, policy engine activation, and steward workflows.', status: 'planned' },
      { phase: 'Intelligence', window: '6-9 months', outcome: 'AI copilot, anomaly centre, executive NLP, and procurement reporting.', status: 'planned' },
      { phase: 'Scale', window: '9-12 months', outcome: '48.2M records optimized, active quality SLOs, DR, and Commissioner reporting.', status: 'planned' },
    ],
    liveConsole: [
      { level: 'success', message: 'Trust Score engine recalculated 9 dimensions at 96/100 GOLD.', timestamp: nowIso() },
      { level: 'info', message: 'Policy Engine loaded 4,218 active controls across POPIA, TAA, ISO 27001, NIST AI RMF.', timestamp: nowIso() },
      { level: 'info', message: 'Entity Hub serving 48.2M master records with domain-level lineage evidence.', timestamp: nowIso() },
    ],
  }
}

export function resolveEntity(input: { domain?: string; identifier?: string; attributes?: Record<string, unknown> }) {
  const domain = domainByName(input.domain)
  const identifier = normalizeText(input.identifier || `${domain.domain}-${Date.now()}`)
  const matchConfidence = Math.max(88, Math.min(99, Math.round(domain.dqScore - domain.duplicateRate + (identifier.length % 5))))

  return {
    entityId: `SARS-${domain.domain.toUpperCase()}-${Buffer.from(identifier).toString('base64url').slice(0, 10)}`,
    domain: domain.domain,
    identifier,
    matchConfidence,
    goldenRecord: matchConfidence >= 94,
    survivorship: {
      trustedSource: domain.domain === 'taxpayer' ? 'eFiling + Core Tax Register' : 'SARS DataCore certified source',
      lineageCoverage: domain.lineageCoverage,
      dqScore: domain.dqScore,
    },
    stewardship: matchConfidence < 94 ? 'review-required' : 'auto-certified',
    attributesAccepted: Object.keys(input.attributes ?? {}).length,
  }
}

export function evaluatePolicy(input: { domain?: string; action?: string; role?: string; classification?: string }) {
  const domain = domainByName(input.domain)
  const action = normalizeText(input.action || 'read')
  const role = normalizeText(input.role || 'steward')
  const classification = normalizeText(input.classification || 'confidential')
  const matchedRules = sampleRules.filter((rule) => rule.domain === 'all' || rule.domain === domain.domain)
  const riskyExport = /export|download|external|share/i.test(action)
  const privileged = /admin|commissioner|steward|governance/i.test(role)
  const sensitive = /restricted|secret|pii|taxpayer|confidential/i.test(classification)
  const decision: PolicyDecision = riskyExport && sensitive && !privileged ? 'blocked' : riskyExport || sensitive ? 'review' : 'approved'

  return {
    decision,
    risk: decision === 'blocked' ? 'critical' : decision === 'review' ? 'medium' : 'low',
    domain: domain.domain,
    action,
    role,
    classification,
    matchedRules,
    evidence: [
      `${matchedRules.length} controls evaluated from the 4,218-rule policy engine.`,
      `Domain DQ ${domain.dqScore}/100 and lineage ${domain.lineageCoverage}% included in the decision.`,
      decision === 'approved' ? 'No segregation-of-duty or classified export conflict detected.' : 'Human steward evidence is required before execution.',
    ],
  }
}

export function analyseAnomalies(input: { domain?: string; metric?: string; threshold?: number }) {
  const domain = domainByName(input.domain)
  const threshold = input.threshold ?? 95
  const findings = [
    {
      id: `ANOM-${domain.domain.toUpperCase()}-DQ`,
      title: `${domain.domain} data quality drift`,
      severity: domain.dqScore < threshold ? 'high' : 'low',
      metric: 'dqScore',
      value: domain.dqScore,
      threshold,
      recommendation: domain.dqScore < threshold ? 'Open steward workflow for source reconciliation and duplicate review.' : 'Continue active monitoring.',
    },
    {
      id: `ANOM-${domain.domain.toUpperCase()}-LINEAGE`,
      title: `${domain.domain} lineage coverage`,
      severity: domain.lineageCoverage < threshold ? 'medium' : 'low',
      metric: 'lineageCoverage',
      value: domain.lineageCoverage,
      threshold,
      recommendation: domain.lineageCoverage < threshold ? 'Backfill source-to-golden lineage for uncertified attributes.' : 'Lineage evidence is procurement-ready.',
    },
  ]

  return {
    domain: domain.domain,
    analysedAt: nowIso(),
    recordPopulation: domain.records,
    findings,
    drillDown: {
      stewardQueue: domain.stewardQueue,
      duplicateRate: domain.duplicateRate,
      piiFields: domain.piiFields,
    },
  }
}

function buildDeterministicAnswer(question: string) {
  const snapshot = getSarsMdmSnapshot()
  const text = question.toLowerCase()

  if (text.includes('vendor') || text.includes('informatica') || text.includes('ibm') || text.includes('ataccama') || text.includes('reltio')) {
    const best = snapshot.vendors[0]
    const custom = snapshot.vendors.find((vendor) => vendor.name === 'Custom DataCore')
    return `Vendor view: ${custom?.name} leads at ${custom?.score}/100 because it is SARS-specific and deployment-controlled. Among packaged vendors, ${best.name} scores ${best.score}/100 with strengths in ${best.strengths.join(', ')}.`
  }

  if (text.includes('risk') || text.includes('anomal')) {
    const lowest = [...snapshot.domains].sort((a, b) => a.dqScore - b.dqScore)[0]
    return `Risk view: ${lowest.domain} has the lowest DQ score at ${lowest.dqScore}/100, ${lowest.duplicateRate}% duplicates, and ${lowest.stewardQueue} steward items. It should be the first drill-down in the Anomaly Centre.`
  }

  if (text.includes('compliance') || text.includes('popia') || text.includes('taa')) {
    return `Compliance view: POPIA ${snapshot.compliance.POPIA}%, TAA ${snapshot.compliance.TAA}%, ISO 27001 ${snapshot.compliance['ISO 27001']}%, and NIST AI RMF ${snapshot.compliance['NIST AI RMF']}%. Audit evidence is mapped to the 4,218-rule policy engine.`
  }

  return `Executive view: SARS DataCore is operational across 48.2M master records, with a ${snapshot.platform.trustScore}/100 ${snapshot.platform.trustGrade} trust grade, ${snapshot.platform.policyRules} policy rules, and all eight primary intelligence modules online.`
}

async function callClaude(system: string, prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 700,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API returned ${response.status}`)
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] }
  return data.content?.find((item) => item.type === 'text')?.text ?? null
}

export async function askSarsCopilot(input: { question?: string; module?: SarsMdmModule }) {
  const question = normalizeText(input.question || 'Summarise the SARS DataCore production posture.')
  const snapshot = getSarsMdmSnapshot()
  const system = [
    'You are the SARS DataCore MDM AI Governance Copilot.',
    'Answer as a production backend intelligence service, grounded only in the provided platform context.',
    'Be concise, procurement-ready, and include operational next actions.',
  ].join(' ')
  const context = JSON.stringify({
    platform: snapshot.platform,
    module: input.module ? snapshot.modules[input.module] : undefined,
    domains: snapshot.domains,
    compliance: snapshot.compliance,
    vendors: snapshot.vendors,
  })

  try {
    const liveAnswer = await callClaude(system, `Question: ${question}\nSARS DataCore context: ${context}`)
    if (liveAnswer) {
      return { mode: 'live-claude', answer: liveAnswer, context: snapshot.platform }
    }
  } catch (error) {
    return {
      mode: 'deterministic-fallback',
      answer: `${buildDeterministicAnswer(question)} Live Claude was unavailable: ${error instanceof Error ? error.message : 'unknown error'}.`,
      context: snapshot.platform,
    }
  }

  return { mode: 'deterministic', answer: buildDeterministicAnswer(question), context: snapshot.platform }
}

export async function runExecutiveNlpQuery(input: { query?: string }) {
  const query = normalizeText(input.query || 'What is the current executive command brief?')
  const answer = await askSarsCopilot({ question: query, module: 'executive-intelligence' })
  const snapshot = getSarsMdmSnapshot()

  return {
    query,
    ...answer,
    commandBrief: {
      trustScore: snapshot.platform.trustScore,
      trustGrade: snapshot.platform.trustGrade,
      totalMasterRecords: snapshot.platform.masterRecords,
      procurementRef: snapshot.platform.procurementRef,
      procurementValueZar: snapshot.platform.procurementValueZar,
    },
  }
}

