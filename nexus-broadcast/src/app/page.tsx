'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformSnapshot } from '@/lib/types'

async function requestJson<T>(url: string) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

function tone(status: string) {
  if (['live', 'on-air', 'ready', 'connected', 'active'].includes(status)) return 'live'
  if (['critical', 'degraded', 'warning', 'switching', 'blocked'].includes(status)) return 'warning'
  return 'standby'
}

export default function ConnectedTvPage() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await requestJson<PlatformSnapshot>('/api/system')
        setSnapshot(data)
        setSelectedId(data.activeProductionId ?? data.productions[0]?.id ?? null)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load connected TV platform state.')
      }
    }
    void load()
  }, [])

  const channels = useMemo(() => {
    if (!snapshot) return []
    const breakRules = snapshot.orchestrate.rules.filter((rule) => rule.enabled).length
    return snapshot.productions.map((production, index) => {
      const site = snapshot.sites.find((item) => item.id === production.siteId)
      const studio = snapshot.virtualStudios.find((item) => item.id === production.studioId)
      const chain = snapshot.mcrChains.find((item) => item.id === production.mcrChainId)
      return {
        id: production.id,
        name: production.name,
        status: production.status,
        genre: production.productionType,
        region: site?.location ?? 'Global',
        studio: studio?.name ?? 'Hybrid studio',
        host: studio?.host ?? 'hybrid',
        distribution: chain?.distribution ?? 'OTT pending',
        notes: production.notes,
        outputs: production.outputTargets.slice(0, 3),
        breaks: breakRules + index + 2,
        locals: Math.max(2, production.outputTargets.length - 1),
      }
    })
  }, [snapshot])

  const selected = useMemo(() => channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null, [channels, selectedId])

  const kpis = useMemo(() => {
    if (!snapshot) return []
    return [
      { label: 'Live channels', value: channels.filter((channel) => channel.status === 'live').length, detail: 'Connected TV feeds on air' },
      { label: 'Ad avails', value: channels.reduce((sum, channel) => sum + channel.breaks, 0), detail: 'SCTE-triggered monetization windows' },
      { label: 'Local inserts', value: channels.reduce((sum, channel) => sum + channel.locals, 0), detail: 'Regional content opportunities' },
      { label: 'Automation rules', value: snapshot.orchestrate.rules.filter((rule) => rule.enabled).length, detail: 'Break and playout policies armed' },
    ]
  }, [channels, snapshot])

  const schedule = useMemo(() => {
    if (!snapshot) return []
    return snapshot.orchestrate.schedules.map((item, index) => ({
      ...item,
      channel: channels[index % Math.max(channels.length, 1)]?.name ?? 'Platform default',
    }))
  }, [channels, snapshot])

  const scteLedger = useMemo(
    () =>
      channels.map((channel, index) => ({
        id: channel.id,
        marker: `SCTE-35 ${String(index + 1).padStart(2, '0')}`,
        action: index % 2 === 0 ? 'Open ad pod' : 'Return to program',
        state: `${channel.breaks} avail windows armed`,
        channel: channel.name,
      })),
    [channels],
  )

  const stacks = useMemo(() => {
    if (!snapshot) return []
    return [
      {
        title: 'Ad insertion',
        detail: `${snapshot.routes.filter((route) => route.state === 'active').length} active routes ready for SSAI or stitched FAST delivery.`,
      },
      {
        title: 'Local programming',
        detail: `${new Set(snapshot.sites.map((site) => site.location)).size} regional surfaces for news, promo, and sponsorship insertion.`,
      },
      {
        title: 'Revenue and audit',
        detail: `${snapshot.jobs.length} recent jobs and ${snapshot.events.length} audit events supporting proof of playout and ops visibility.`,
      },
    ]
  }, [snapshot])

  const clock = useMemo(() => {
    if (!snapshot?.generatedAt) return '--:--:--'
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(
      new Date(snapshot.generatedAt),
    )
  }, [snapshot])

  return (
    <main className="ctvShell">
      <section className="ctvHero">
        <div>
          <p className="eyebrow">Connected TV Platform</p>
          <h1>Standalone FAST and digital broadcast operations with SCTE markers, ad insertion, monetization, and local programming automation.</h1>
          <p className="lede">
            Built as a standalone product, not just a control module. The platform combines channel management, cue messaging, regional insertion, cloud
            playout, and revenue tooling into one surface.
          </p>
          <div className="ctvHeroActions">
            <Link href="/orchestrate" className="ghostButton">
              Broadcast ops
            </Link>
            <Link href="/fast" className="ghostButton">
              FAST workspace
            </Link>
            <span className="statusPill live">clock {clock}</span>
          </div>
        </div>
        <div className="ctvHeroRail">
          <article className="ctvSignalCard">
            <small>Cloud posture</small>
            <strong>{snapshot?.orchestrate.cloudMode ?? 'loading'}</strong>
            <span>Hybrid playout control</span>
          </article>
          <article className="ctvSignalCard">
            <small>Monetization</small>
            <strong>{channels.length ? `${channels.reduce((sum, channel) => sum + channel.breaks, 0)} avails` : 'loading'}</strong>
            <span>Break opportunities across the lineup</span>
          </article>
          <article className="ctvSignalCard">
            <small>Automation</small>
            <strong>{snapshot?.orchestrate.workflows.length ?? 0} flows</strong>
            <span>Schedules, rules, and event-driven actions</span>
          </article>
        </div>
      </section>

      <section className="ctvKpiGrid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="kpiCard">
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </article>
        ))}
      </section>

      <section className="ctvWorkspace">
        <div className="ctvMainColumn">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Channel lineup</p>
                <h2>Connected TV channels with local insertion windows</h2>
              </div>
            </div>
            <div className="ctvChannelGrid">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={selectedId === channel.id ? 'ctvChannelCard selected' : 'ctvChannelCard'}
                  onClick={() => setSelectedId(channel.id)}
                >
                  <div className="trainingCardHeader">
                    <span className={`badge ${tone(channel.status)}`}>{channel.status}</span>
                    <small>
                      {channel.genre} • {channel.region}
                    </small>
                  </div>
                  <h3>{channel.name}</h3>
                  <p>{channel.notes}</p>
                  <div className="ctvMetaRow">
                    <small>{channel.studio}</small>
                    <small>{channel.host}</small>
                    <small>{channel.breaks} ad windows</small>
                    <small>{channel.locals} local inserts</small>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Channel command</p>
                <h2>{selected?.name ?? 'Waiting for channel data'}</h2>
              </div>
            </div>
            {selected ? (
              <div className="ctvDetailGrid">
                <article className="ctvDetailCard">
                  <span className="panelLabel">Distribution</span>
                  <strong>{selected.distribution}</strong>
                  <p>Broadcast and connected TV endpoint strategy.</p>
                </article>
                <article className="ctvDetailCard">
                  <span className="panelLabel">SCTE control</span>
                  <strong>{selected.breaks} cue windows</strong>
                  <p>Markers available for ad pods, promos, and return-to-program logic.</p>
                </article>
                <article className="ctvDetailCard">
                  <span className="panelLabel">Local programming</span>
                  <strong>{selected.locals} regional windows</strong>
                  <p>{selected.outputs.join(' • ')}</p>
                </article>
              </div>
            ) : (
              <p className="trainingText">Loading selected channel.</p>
            )}
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Automation rail</p>
                <h2>Program starts, breaks, and promo return workflows</h2>
              </div>
            </div>
            <div className="ctvTimeline">
              {schedule.map((item) => (
                <article key={item.id} className="ctvTimelineRow">
                  <strong>{item.time}</strong>
                  <div>
                    <p>{item.workflowName}</p>
                    <small>
                      {item.channel} • {item.days}
                    </small>
                  </div>
                  <span className={item.enabled ? 'statusPill live' : 'statusPill subtle'}>{item.enabled ? 'enabled' : 'paused'}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">SCTE ledger</p>
                <h2>Marker operations for avails and returns</h2>
              </div>
            </div>
            <div className="ctvLedgerGrid">
              {scteLedger.map((item) => (
                <article key={item.id} className="ctvLedgerCard">
                  <div className="trainingCardHeader">
                    <span className="badge standby">{item.marker}</span>
                    <small>{item.state}</small>
                  </div>
                  <strong>{item.channel}</strong>
                  <p>{item.action}</p>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="ctvSideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Monetization stack</p>
                <h2>Integrated ad ops and revenue tooling</h2>
              </div>
            </div>
            <div className="ctvStackList">
              {stacks.map((stack) => (
                <article key={stack.title} className="ctvStackCard">
                  <strong>{stack.title}</strong>
                  <p>{stack.detail}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Playout grid</p>
                <h2>Origins, MCR, and delivery surfaces</h2>
              </div>
            </div>
            <div className="ctvDistributionList">
              {snapshot?.mcrChains.map((chain) => (
                <article key={chain.id} className="ctvDistributionCard">
                  <div className="trainingCardHeader">
                    <span className={`badge ${tone(chain.status)}`}>{chain.status}</span>
                    <small>{chain.distribution}</small>
                  </div>
                  <strong>{chain.name}</strong>
                  <p>{chain.playout}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Ops feed</p>
                <h2>Audit, alerts, and proof of playout</h2>
              </div>
            </div>
            <div className="alertList">
              {snapshot?.alerts.map((item) => (
                <article key={item.id} className={`alertCard ${item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info'}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </aside>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}
    </main>
  )
}
