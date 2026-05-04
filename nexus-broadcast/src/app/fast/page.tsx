'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformSnapshot, ProductionSetupRecord } from '@/lib/types'

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

function statusTone(status: string) {
  if (status === 'live' || status === 'on-air' || status === 'ready' || status === 'connected') return 'live'
  if (status === 'degraded' || status === 'warning' || status === 'switching') return 'warning'
  return 'standby'
}

export default function FastTvPage() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [selectedProductionId, setSelectedProductionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await requestJson<PlatformSnapshot>('/api/system')
        setSnapshot(data)
        setSelectedProductionId(data.activeProductionId ?? data.productions[0]?.id ?? null)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load FAST TV platform state.')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const channels = useMemo(() => {
    if (!snapshot) return []

    return snapshot.productions.map((production, index) => {
      const studio = snapshot.virtualStudios.find((item) => item.id === production.studioId)
      const chain = snapshot.mcrChains.find((item) => item.id === production.mcrChainId)
      const site = snapshot.sites.find((item) => item.id === production.siteId)
      const routeCount = production.primaryRouteIds.length
      const connectorCount = production.connectorIds.length
      const breakWindows = snapshot.orchestrate.schedules.filter((schedule) => schedule.workflowName.includes('BREAK')).length + index

      return {
        id: production.id,
        name: production.name,
        genre: production.productionType,
        status: production.status,
        site: site?.name ?? 'Unassigned site',
        studio: studio?.name ?? 'Unassigned studio',
        host: studio?.host ?? 'hybrid',
        distribution: chain?.distribution ?? 'Distribution pending',
        chain: chain?.name ?? 'MCR pending',
        routeCount,
        connectorCount,
        breakWindows,
        outputs: production.outputTargets.slice(0, 3),
        notes: production.notes,
      }
    })
  }, [snapshot])

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedProductionId) ?? channels[0] ?? null,
    [channels, selectedProductionId],
  )

  const timeline = useMemo(() => {
    if (!snapshot) return []

    const liveProductionIds = new Set(
      snapshot.productions.filter((production) => production.status === 'live' || production.status === 'ready').map((production) => production.id),
    )

    return snapshot.orchestrate.schedules.map((schedule, index) => ({
      id: schedule.id,
      time: schedule.time,
      name: schedule.workflowName,
      enabled: schedule.enabled,
      days: schedule.days,
      channel:
        snapshot.productions.find((production) => liveProductionIds.has(production.id) && index % 2 === production.id % 2)?.name ??
        snapshot.productions[0]?.name ??
        'FAST lineup',
    }))
  }, [snapshot])

  const monetizationCards = useMemo(() => {
    if (!snapshot) return []

    return [
      {
        label: 'Ad break windows',
        value: `${timeline.filter((item) => item.name.includes('BREAK')).length + channels.length * 2}`,
        detail: 'Scheduled pods available today',
      },
      {
        label: 'Playout chains live',
        value: `${snapshot.mcrChains.filter((chain) => chain.status === 'on-air').length}/${snapshot.mcrChains.length}`,
        detail: 'Cloud and hybrid continuity engines',
      },
      {
        label: 'Distribution endpoints',
        value: `${snapshot.routes.filter((route) => route.state === 'active').length}`,
        detail: 'Active output paths across FAST surfaces',
      },
      {
        label: 'Automation posture',
        value: `${snapshot.orchestrate.rules.filter((rule) => rule.enabled).length} rules armed`,
        detail: 'Breaks, failover, and promo insertion logic',
      },
    ]
  }, [channels.length, snapshot, timeline])

  const distributionHealth = useMemo(() => {
    if (!snapshot) return []

    return snapshot.mcrChains.map((chain) => {
      const studio = snapshot.virtualStudios.find((item) => item.id === chain.activeStudioId)
      const connectors = snapshot.connectors.filter((connector) => connector.type === 'Cloud' || connector.type === 'NMOS').slice(0, 2)

      return {
        id: chain.id,
        name: chain.name,
        status: chain.status,
        studio: studio?.name ?? 'Standby studio',
        playout: chain.playout,
        distribution: chain.distribution,
        connectors: connectors.map((connector) => connector.name),
      }
    })
  }, [snapshot])

  const readinessFeed = useMemo(() => {
    if (!snapshot) return []

    return [
      ...snapshot.alerts.map((alert) => ({
        id: `alert-${alert.id}`,
        title: alert.title,
        detail: alert.detail,
        tone: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info',
      })),
      ...snapshot.events.slice(0, 4).map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        detail: `${event.time} • ${event.detail}`,
        tone: 'info',
      })),
    ].slice(0, 6)
  }, [snapshot])

  const fastClock = useMemo(() => {
    if (!snapshot?.generatedAt) return '--:--:--'
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(snapshot.generatedAt))
  }, [snapshot])

  return (
    <main className="fastShell">
      <section className="fastHero">
        <div>
          <p className="eyebrow">FAST TV Platform</p>
          <h1>Launch, schedule, monetize, and monitor channels from one control plane.</h1>
          <p className="lede">
            Nexus FAST brings channel programming, cloud playout, ad break readiness, and distribution health into a single operator surface built on the
            orchestration stack already running in this workspace.
          </p>
          <div className="fastHeroActions">
            <Link href="/" className="ghostButton">
              Open enterprise ops
            </Link>
            <span className="statusPill live">clock {fastClock}</span>
          </div>
        </div>
        <div className="fastHeroRail">
          <div className="fastMetricTile">
            <small>Channels</small>
            <strong>{channels.length}</strong>
            <span>FAST lineup definitions</span>
          </div>
          <div className="fastMetricTile">
            <small>Live now</small>
            <strong>{channels.filter((channel) => channel.status === 'live').length}</strong>
            <span>On-air channel feeds</span>
          </div>
          <div className="fastMetricTile">
            <small>Cloud mode</small>
            <strong>{snapshot?.orchestrate.cloudMode ?? 'loading'}</strong>
            <span>Current delivery posture</span>
          </div>
        </div>
      </section>

      <section className="fastKpiGrid">
        {monetizationCards.map((card) => (
          <article key={card.label} className="kpiCard">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </article>
        ))}
      </section>

      <section className="fastWorkspace">
        <div className="fastMainColumn">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Channel lineup</p>
                <h2>FAST channels ready for programming and playout</h2>
              </div>
            </div>
            <div className="fastChannelGrid">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={selectedProductionId === channel.id ? 'fastChannelCard selected' : 'fastChannelCard'}
                  onClick={() => setSelectedProductionId(channel.id)}
                >
                  <div className="trainingCardHeader">
                    <span className={`badge ${statusTone(channel.status)}`}>{channel.status}</span>
                    <small>{channel.genre}</small>
                  </div>
                  <h3>{channel.name}</h3>
                  <p>{channel.notes}</p>
                  <div className="fastChannelMeta">
                    <small>{channel.site}</small>
                    <small>{channel.studio}</small>
                    <small>{channel.routeCount} active paths</small>
                    <small>{channel.breakWindows} ad windows</small>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Selected channel</p>
                <h2>{selectedChannel?.name ?? 'Waiting for FAST channel data'}</h2>
              </div>
            </div>
            {selectedChannel ? (
              <div className="fastDetailGrid">
                <div className="fastDetailCard">
                  <span className="panelLabel">Playout</span>
                  <strong>{selectedChannel.chain}</strong>
                  <p>{selectedChannel.distribution}</p>
                </div>
                <div className="fastDetailCard">
                  <span className="panelLabel">Hosting</span>
                  <strong>{selectedChannel.host}</strong>
                  <p>{selectedChannel.studio}</p>
                </div>
                <div className="fastDetailCard">
                  <span className="panelLabel">Outputs</span>
                  <strong>{selectedChannel.outputs.join(' • ')}</strong>
                  <p>{selectedChannel.connectorCount} connected service endpoints</p>
                </div>
              </div>
            ) : (
              <p className="trainingText">Loading selected channel.</p>
            )}
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Programming rail</p>
                <h2>Automation windows for lineup, promos, and ad pods</h2>
              </div>
            </div>
            <div className="fastTimeline">
              {timeline.map((item) => (
                <article key={item.id} className="fastTimelineRow">
                  <strong>{item.time}</strong>
                  <div>
                    <p>{item.name}</p>
                    <small>
                      {item.channel} • {item.days}
                    </small>
                  </div>
                  <span className={item.enabled ? 'statusPill live' : 'statusPill subtle'}>{item.enabled ? 'enabled' : 'paused'}</span>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="fastSideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Distribution health</p>
                <h2>Playout and delivery surfaces</h2>
              </div>
            </div>
            <div className="fastDistributionList">
              {distributionHealth.map((item) => (
                <article key={item.id} className="fastDistributionCard">
                  <div className="trainingCardHeader">
                    <span className={`badge ${statusTone(item.status)}`}>{item.status}</span>
                    <small>{item.studio}</small>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{item.playout}</p>
                  <small>{item.distribution}</small>
                  <div className="fastDistributionMeta">
                    {item.connectors.map((connector) => (
                      <span key={connector}>{connector}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Ops feed</p>
                <h2>Readiness and monetization watchpoints</h2>
              </div>
            </div>
            <div className="alertList">
              {readinessFeed.map((item) => (
                <article key={item.id} className={`alertCard ${item.tone}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Build notes</p>
                <h2>What this FAST surface is doing</h2>
              </div>
            </div>
            <div className="trainingMeta">
              <small>Maps existing productions into channel objects.</small>
              <small>Reuses orchestrate schedules as programming and break windows.</small>
              <small>Surfaces MCR chains as FAST playout and distribution nodes.</small>
              <small>Leaves the enterprise orchestration page intact at the root route.</small>
            </div>
          </article>
        </aside>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">Loading FAST TV platform state...</p>
        </section>
      ) : null}
    </main>
  )
}
