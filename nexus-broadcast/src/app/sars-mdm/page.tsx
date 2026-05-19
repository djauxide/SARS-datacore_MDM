'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { SarsMdmSnapshot } from '@/lib/sars-datacore'

type CopilotResponse = {
  mode: string
  answer: string
  commandBrief?: {
    trustScore: number
    trustGrade: string
    totalMasterRecords: number
    procurementRef: string
    procurementValueZar: number
  }
}

type PolicyResponse = {
  policy: {
    decision: 'approved' | 'review' | 'blocked'
    risk: string
    matchedRules: { id: string; framework: string; control: string; severity: string }[]
    evidence: string[]
  }
}

type AnomalyResponse = {
  analysis: {
    domain: string
    recordPopulation: number
    findings: { id: string; title: string; severity: string; metric: string; value: number; threshold: number; recommendation: string }[]
    drillDown: { stewardQueue: number; duplicateRate: number; piiFields: number }
  }
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-ZA').format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function badgeTone(value: string) {
  if (['approved', 'low', 'operational', 'ready', 'success'].includes(value)) return 'live'
  if (['blocked', 'critical'].includes(value)) return 'critical'
  return 'warning'
}

export default function SarsMdmPage() {
  const [snapshot, setSnapshot] = useState<SarsMdmSnapshot | null>(null)
  const [question, setQuestion] = useState('Which domain needs Commissioner attention this week?')
  const [answer, setAnswer] = useState<CopilotResponse | null>(null)
  const [policy, setPolicy] = useState<PolicyResponse['policy'] | null>(null)
  const [anomaly, setAnomaly] = useState<AnomalyResponse['analysis'] | null>(null)
  const [busy, setBusy] = useState<string | null>('load')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const system = await requestJson<SarsMdmSnapshot>('/api/sars-mdm/system')
    setSnapshot(system)
  }

  useEffect(() => {
    void load()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load SARS DataCore.'))
      .finally(() => setBusy(null))
  }, [])

  const weakestDomain = useMemo(() => {
    return snapshot ? [...snapshot.domains].sort((a, b) => a.dqScore - b.dqScore)[0] : null
  }, [snapshot])

  const runNlp = async (query = question) => {
    setBusy('nlp')
    setError(null)
    try {
      const response = await requestJson<CopilotResponse>('/api/sars-mdm/nlp', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })
      setAnswer(response)
    } catch (nlpError) {
      setError(nlpError instanceof Error ? nlpError.message : 'NLP query failed.')
    } finally {
      setBusy(null)
    }
  }

  const runPolicy = async () => {
    setBusy('policy')
    setError(null)
    try {
      const response = await requestJson<PolicyResponse>('/api/sars-mdm/policy', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'taxpayer',
          action: 'export restricted taxpayer data',
          role: 'operator',
          classification: 'restricted pii',
        }),
      })
      setPolicy(response.policy)
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : 'Policy evaluation failed.')
    } finally {
      setBusy(null)
    }
  }

  const runAnomaly = async (domain = weakestDomain?.domain ?? 'customs') => {
    setBusy('anomaly')
    setError(null)
    try {
      const response = await requestJson<AnomalyResponse>('/api/sars-mdm/anomalies', {
        method: 'POST',
        body: JSON.stringify({ domain, threshold: 95 }),
      })
      setAnomaly(response.analysis)
    } catch (anomalyError) {
      setError(anomalyError instanceof Error ? anomalyError.message : 'Anomaly analysis failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="sarsShell">
      <section className="sarsTopbar">
        <div>
          <p className="eyebrow">SARS DataCore</p>
          <h1>Commissioner command layer for master data, AI governance, compliance, and procurement evidence.</h1>
        </div>
        <div className="sarsNav">
          <Link href="/management" className="ghostButton">
            Nexus platform
          </Link>
          <button type="button" className="ghostButton activeToggle" onClick={() => void runNlp()} disabled={busy === 'nlp'}>
            {busy === 'nlp' ? 'Asking...' : 'Ask DataCore'}
          </button>
        </div>
      </section>

      {error ? <p className="sarsError">{error}</p> : null}

      <section className="sarsHero">
        <article className="sarsTrustPanel">
          <span>Platform Data Trust Score</span>
          <strong>{snapshot?.platform.trustScore ?? 0}/100</strong>
          <small>{snapshot?.platform.trustGrade ?? 'GOLD'} grade across 9 dimensions</small>
          <div className="sarsTrustBar">
            <span style={{ width: `${snapshot?.platform.trustScore ?? 0}%` }} />
          </div>
        </article>
        <article className="sarsHeroBrief">
          <p className="panelLabel">Executive command brief</p>
          <h2>{snapshot?.platform.name ?? 'SARS DataCore MDM Platform'}</h2>
          <p>
            Production model covering {formatNumber(snapshot?.platform.masterRecords ?? 48200000)} master records,
            {` ${formatNumber(snapshot?.platform.policyRules ?? 4218)} `} governance rules, certified compliance reporting, and live AI-assisted decision support.
          </p>
          <div className="sarsBriefMeta">
            <span>{snapshot?.platform.procurementRef}</span>
            <span>{formatCurrency(snapshot?.platform.procurementValueZar ?? 480000000)}</span>
            <span>Claude-ready server proxy</span>
          </div>
        </article>
      </section>

      <section className="sarsKpis">
        <article className="kpiCard">
          <span>Master records</span>
          <strong>{formatNumber(snapshot?.platform.masterRecords ?? 0)}</strong>
          <small>Six governed domains</small>
        </article>
        <article className="kpiCard">
          <span>Policy rules</span>
          <strong>{formatNumber(snapshot?.platform.policyRules ?? 0)}</strong>
          <small>POPIA, TAA, ISO 27001, NIST AI RMF</small>
        </article>
        <article className="kpiCard">
          <span>Weakest DQ domain</span>
          <strong>{weakestDomain?.domain ?? 'customs'}</strong>
          <small>{weakestDomain?.dqScore ?? 94}/100 score</small>
        </article>
        <article className="kpiCard">
          <span>Procurement value</span>
          <strong>{formatCurrency(snapshot?.platform.procurementValueZar ?? 0)}</strong>
          <small>Distribution-ready evidence pack</small>
        </article>
      </section>

      <section className="sarsWorkspace">
        <div className="sarsMainColumn">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Core platform</p>
                <h2>Primary modules</h2>
              </div>
            </div>
            <div className="sarsModuleGrid">
              {snapshot
                ? Object.entries(snapshot.modules).map(([key, module]) => (
                    <article key={key} className="sarsCard">
                      <span className={`badge ${badgeTone(module.status)}`}>{module.status}</span>
                      <h3>{module.name}</h3>
                      <p>{module.summary}</p>
                    </article>
                  ))
                : null}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Entity hub and lineage</p>
                <h2>Domain trust engine</h2>
              </div>
              <button type="button" className="ghostButton" onClick={() => void runAnomaly()} disabled={busy === 'anomaly'}>
                {busy === 'anomaly' ? 'Analysing...' : 'Run anomaly scan'}
              </button>
            </div>
            <div className="sarsDomainTable">
              {snapshot?.domains.map((domain) => (
                <button key={domain.domain} type="button" className="sarsDomainRow" onClick={() => void runAnomaly(domain.domain)}>
                  <strong>{domain.domain}</strong>
                  <span>{formatNumber(domain.records)} records</span>
                  <span>{domain.dqScore}/100 DQ</span>
                  <span>{domain.lineageCoverage}% lineage</span>
                  <span>{domain.stewardQueue} steward items</span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Vendor evaluation</p>
                <h2>Scorecard</h2>
              </div>
            </div>
            <div className="sarsVendorGrid">
              {snapshot?.vendors.map((vendor) => (
                <article key={vendor.name} className={vendor.name === 'Custom DataCore' ? 'sarsVendorCard preferred' : 'sarsVendorCard'}>
                  <div className="trainingCardHeader">
                    <h3>{vendor.name}</h3>
                    <span className={`badge ${badgeTone(vendor.risk)}`}>{vendor.risk}</span>
                  </div>
                  <strong>{vendor.score}/100</strong>
                  <p>{vendor.strengths.join(' / ')}</p>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="sarsSideColumn">
          <article className="panel">
            <p className="panelLabel">Live NLP query engine</p>
            <h2>Ask anything</h2>
            <textarea className="sarsPrompt" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <div className="buttonRow">
              <button type="button" className="ghostButton activeToggle" onClick={() => void runNlp()} disabled={busy === 'nlp'}>
                {busy === 'nlp' ? 'Thinking...' : 'Run query'}
              </button>
              <button type="button" className="ghostButton" onClick={() => void runNlp('Compare Custom DataCore to Informatica for SARS procurement.')}>
                Vendor brief
              </button>
            </div>
            <div className="sarsAnswer">
              <span className={`badge ${answer?.mode === 'live-claude' ? 'live' : 'standby'}`}>{answer?.mode ?? 'ready'}</span>
              <p>{answer?.answer ?? 'The engine is ready. Add ANTHROPIC_API_KEY on the server to switch from deterministic mode to live Claude mode.'}</p>
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Policy engine</p>
                <h2>RBAC and compliance test</h2>
              </div>
              <button type="button" className="ghostButton" onClick={() => void runPolicy()} disabled={busy === 'policy'}>
                Evaluate
              </button>
            </div>
            <div className="sarsPolicyBox">
              <span className={`badge ${badgeTone(policy?.decision ?? 'review')}`}>{policy?.decision ?? 'not run'}</span>
              <p>{policy?.evidence[0] ?? 'Test: operator attempts restricted taxpayer export.'}</p>
              {policy?.matchedRules.slice(0, 3).map((rule) => (
                <small key={rule.id}>{rule.id} / {rule.framework}: {rule.control}</small>
              ))}
            </div>
          </article>

          <article className="panel">
            <p className="panelLabel">Anomaly centre</p>
            <h2>{anomaly ? `${anomaly.domain} drill-down` : 'Awaiting scan'}</h2>
            <div className="sarsPolicyBox">
              <p>{anomaly ? `${formatNumber(anomaly.recordPopulation)} records analysed.` : 'Run a scan from the domain trust engine.'}</p>
              {anomaly?.findings.map((finding) => (
                <small key={finding.id}>{finding.title}: {finding.value}/{finding.threshold}. {finding.recommendation}</small>
              ))}
              {anomaly ? <small>Steward queue {anomaly.drillDown.stewardQueue} / duplicates {anomaly.drillDown.duplicateRate}% / PII fields {anomaly.drillDown.piiFields}</small> : null}
            </div>
          </article>

          <article className="panel">
            <p className="panelLabel">System console</p>
            <h2>Live evidence stream</h2>
            <div className="sarsConsole">
              {snapshot?.liveConsole.map((entry, index) => (
                <p key={`${entry.timestamp}-${index}`}>
                  <span>{entry.level}</span>
                  {entry.message}
                </p>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  )
}

