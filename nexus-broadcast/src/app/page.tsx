'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PlatformSnapshot, ProductionSetupRecord, SessionRecord, UserRecord, UserRole } from '@/lib/types'

type Workspace = 'operator' | 'engineer' | 'trainee' | 'admin'

const manufacturerCatalog = [
  { name: 'Ross Video', focus: 'switchers, routing control, graphics', modules: ['Production switcher', 'Routing control', 'Graphics engine'] },
  { name: 'Grass Valley', focus: 'routing, multiview, live production', modules: ['Hybrid router', 'Multiview frame', 'Production gateway'] },
  { name: 'EVS', focus: 'replay, media processing, orchestration', modules: ['Replay channel', 'Media gateway', 'Control core'] },
  { name: 'Sony', focus: 'IP Live switchers, cameras, control', modules: ['IP switcher', 'Camera chain', 'Studio control'] },
  { name: 'Blackmagic Design', focus: 'ATEM switching, conversion, I/O', modules: ['ATEM panel', 'Conversion rack', 'HyperDeck ingest'] },
  { name: 'Riedel', focus: 'intercom, signal distribution, control', modules: ['Intercom matrix', 'Smart panel', 'MediorNet fabric'] },
  { name: 'TSL', focus: 'tally, control, monitoring', modules: ['Tally manager', 'Control panels', 'Workflow monitor'] },
  { name: 'Evertz', focus: 'routing, multiview, signal processing', modules: ['Core router', 'Multiview node', 'Edge processing'] },
  { name: 'Lawo', focus: 'IP management, audio, control', modules: ['HOME domain', 'Audio console', 'Processing node'] },
  { name: 'Imagine Communications', focus: 'SNP routing, playout, timing', modules: ['SNP router', 'Playout chain', 'Timing bridge'] },
  { name: 'AJA', focus: 'conversion, bridge, ingest/egress', modules: ['Signal bridge', 'Mini-converters', 'I/O gateway'] },
] as const

const workspaceCopy: Record<Workspace, { label: string; title: string; summary: string }> = {
  operator: {
    label: 'Operator',
    title: 'Live production control for transmission, switching, and on-air continuity.',
    summary: 'Run scenarios, monitor incidents, and keep active services stable across the platform.',
  },
  engineer: {
    label: 'Engineer',
    title: 'Engineering control for discovery, NMOS, monitoring, and legacy integration.',
    summary: 'Track site health, inspect connectors, and operate GPIO-linked legacy devices with live telemetry.',
  },
  trainee: {
    label: 'Trainee',
    title: 'Structured learning and simulation for new operators and engineers.',
    summary: 'Use scenario-driven training and the integrated curriculum to build repeatable operational confidence.',
  },
  admin: {
    label: 'Admin',
    title: 'Enterprise oversight for tenants, sites, users, and platform posture.',
    summary: 'Supervise the whole deployment footprint, role assignments, and service connectivity across regions.',
  },
}

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

function workspaceForRole(role: UserRole): Workspace {
  if (role === 'admin') return 'admin'
  return role
}

export default function NexusEnterprisePage() {
  const [workspace, setWorkspace] = useState<Workspace>('operator')
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null)
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'reconnecting'>('connecting')
  const [error, setError] = useState<string | null>(null)

  const loadSnapshot = async () => {
    const data = await requestJson<PlatformSnapshot>('/api/system')
    setSnapshot(data)
  }

  const loadSession = async () => {
    const [sessionResponse, usersResponse] = await Promise.all([
      requestJson<{ session: SessionRecord }>('/api/auth/session'),
      requestJson<{ users: UserRecord[] }>('/api/system-users'),
    ])

    setSession(sessionResponse.session)
    setWorkspace(workspaceForRole(sessionResponse.session.role))
    setUsers(usersResponse.users)
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadSnapshot(), loadSession()])
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load enterprise platform state.')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    const source = new EventSource('/api/stream')

    source.addEventListener('snapshot', (event) => {
      setStreamStatus('live')
      setSnapshot(JSON.parse(event.data) as PlatformSnapshot)
    })

    source.onerror = () => {
      setStreamStatus('reconnecting')
    }

    return () => source.close()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!session) return users
    return users.filter((user) => user.tenantId === session.tenantId)
  }, [session, users])

  const activeSite = useMemo(() => snapshot?.sites.find((site) => site.id === session?.siteId) ?? snapshot?.sites[0], [session, snapshot])
  const currentProduction = useMemo(
    () => snapshot?.productions.find((production) => production.id === snapshot.activeProductionId) ?? snapshot?.productions[0] ?? null,
    [snapshot],
  )
  const activeRoute = useMemo(() => snapshot?.routes.find((route) => route.state === 'active') ?? null, [snapshot])
  const standbyRoute = useMemo(() => snapshot?.routes.find((route) => route.state === 'standby') ?? null, [snapshot])
  const liveStudio = useMemo(() => snapshot?.virtualStudios.find((studio) => studio.mode === 'live') ?? null, [snapshot])
  const activeMcr = useMemo(() => snapshot?.mcrChains.find((chain) => chain.status === 'on-air') ?? null, [snapshot])
  const productionClock = useMemo(() => {
    if (!snapshot?.generatedAt) return '--:--:--'
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(snapshot.generatedAt))
  }, [snapshot])
  const multiviewTiles = useMemo(() => {
    if (!snapshot) return []

    return [
      ...snapshot.routes.map((route) => ({
        id: `route-${route.id}`,
        label: route.source,
        detail: route.destination,
        status: route.state,
        meta: route.transport,
      })),
      ...snapshot.obUnits.map((unit) => ({
        id: `ob-${unit.id}`,
        label: unit.name,
        detail: unit.venue,
        status: unit.status,
        meta: unit.contribution,
      })),
      ...snapshot.virtualStudios.map((studio) => ({
        id: `studio-${studio.id}`,
        label: studio.name,
        detail: `${studio.host} control`,
        status: studio.mode,
        meta: `${studio.operatorCount} ops`,
      })),
    ].slice(0, 9)
  }, [snapshot])
  const cameraShaders = useMemo(() => {
    if (!snapshot) return []

    return snapshot.colorEngines.map((camera, index) => ({
      id: `cam-${camera.id}`,
      name: camera.camera,
      shader: camera.shader,
      iris: camera.iris,
      paint: camera.paintProfile,
      tally: index === 0 ? 'program' : index === 1 ? 'preview' : 'standby',
      venue: snapshot.obUnits[index % snapshot.obUnits.length]?.venue ?? 'Studio floor',
      gain: `${camera.gainDb} dB`,
      white: `${camera.whiteBalanceK} K`,
      status: camera.status,
    }))
  }, [snapshot])
  const signalFlowColumns = useMemo(() => {
    if (!snapshot) return []

    return [
      {
        label: 'Sources',
        nodes: [
          { label: 'Cameras', detail: `${cameraShaders.length} live`, tone: 'active' },
          { label: 'Replay', detail: snapshot.connectors.find((connector) => connector.type === 'Replay')?.name ?? 'Offline', tone: 'warning' },
          { label: 'OB Feeds', detail: `${snapshot.obUnits.length} units`, tone: 'cloud' },
        ],
      },
      {
        label: 'Core',
        nodes: [
          { label: 'Router', detail: `${snapshot.routes.length} paths`, tone: 'active' },
          { label: 'Audio Core', detail: 'AES67 / ST 2110-30', tone: 'processing' },
          { label: 'Multiview', detail: `${multiviewTiles.length} windows`, tone: 'active' },
        ],
      },
      {
        label: 'Control',
        nodes: [
          { label: 'Switcher', detail: activeRoute?.source ?? 'Awaiting source', tone: 'processing' },
          { label: 'Shading', detail: `${cameraShaders.length} cameras`, tone: 'warning' },
          { label: 'SLM / Color', detail: 'Scopes armed', tone: 'cloud' },
        ],
      },
      {
        label: 'Destinations',
        nodes: [
          { label: 'Studio', detail: liveStudio?.name ?? 'Standby', tone: 'active' },
          { label: 'MCR', detail: activeMcr?.name ?? 'Standby chain', tone: 'active' },
          { label: 'Distribution', detail: activeMcr?.distribution ?? 'Monitoring only', tone: 'cloud' },
        ],
      },
    ]
  }, [activeMcr, activeRoute, cameraShaders, liveStudio, multiviewTiles.length, snapshot])
  const avMonitoring = useMemo(() => {
    if (!snapshot) return []

    return [
      { label: 'Video waveform', value: '709 legal', status: 'stable' },
      { label: 'Vectorscope', value: cameraShaders.some((camera) => camera.status === 'warning') ? 'Match drift' : 'Skin tone aligned', status: cameraShaders.some((camera) => camera.status === 'warning') ? 'watch' : 'stable' },
      ...snapshot.audioMonitors.slice(0, 2).map((monitor) => ({
        label: `${monitor.zone} loudness`,
        value: `${monitor.loudnessLufs} LUFS`,
        status: monitor.confidence === 'warning' ? 'watch' : 'stable',
      })),
    ]
  }, [cameraShaders, snapshot])

  const runScenario = async (slug: string) => {
    setBusyAction(`scenario-${slug}`)
    await requestJson('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const discoverEquipment = async () => {
    setBusyAction('discovery')
    await requestJson('/api/discovery', { method: 'POST' })
    await loadSnapshot()
    setBusyAction(null)
  }

  const toggleGpio = async (id: number) => {
    setBusyAction(`gpio-${id}`)
    await requestJson('/api/gpio', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const acknowledge = async (id: number) => {
    setBusyAction(`alert-${id}`)
    await requestJson('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const changeConnectorStatus = async (id: number, status: 'connected' | 'degraded' | 'offline') => {
    setBusyAction(`connector-${id}-${status}`)
    await requestJson('/api/connectors', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const toggleRoute = async (id: number) => {
    setBusyAction(`route-${id}`)
    await requestJson('/api/routes', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const executeWorkflow = async (id: number) => {
    setBusyAction(`workflow-${id}`)
    await requestJson('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const runConnectorJob = async (connectorId: number, action: 'sync' | 'switch-route' | 'run-workflow' | 'pulse-gpio') => {
    setBusyAction(`job-${connectorId}-${action}`)
    await requestJson('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ connectorId, action }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const activateStudio = async (studioId: number) => {
    setBusyAction(`studio-${studioId}`)
    await requestJson('/api/hybrid', {
      method: 'POST',
      body: JSON.stringify({ action: 'activate-studio', studioId }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const assignObToStudio = async (obUnitId: number, studioId: number) => {
    setBusyAction(`ob-${obUnitId}-${studioId}`)
    await requestJson('/api/hybrid', {
      method: 'POST',
      body: JSON.stringify({ action: 'assign-ob', obUnitId, studioId }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const loginAs = async (userId: number) => {
    setBusyAction(`login-${userId}`)
    const response = await requestJson<{ session: SessionRecord }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
    setSession(response.session)
    setWorkspace(workspaceForRole(response.session.role))
    await loadSnapshot()
    setBusyAction(null)
  }

  const logout = async () => {
    setBusyAction('logout')
    await requestJson('/api/auth/logout', { method: 'POST' })
    await loadSession()
    await loadSnapshot()
    setBusyAction(null)
  }

  const applyProduction = async (id: number) => {
    setBusyAction(`production-${id}`)
    await requestJson('/api/productions', {
      method: 'POST',
      body: JSON.stringify({ action: 'apply', id }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  const cloneProduction = async (production: ProductionSetupRecord) => {
    setBusyAction(`production-save-${production.id}`)
    await requestJson('/api/productions', {
      method: 'POST',
      body: JSON.stringify({
        ...production,
        action: 'save',
        id: undefined,
        name: `${production.name} Copy`,
        status: 'draft',
      }),
    })
    await loadSnapshot()
    setBusyAction(null)
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Nexus Broadcast Orchestrate Enterprise</p>
          <h1>Enterprise orchestration for live production, engineering operations, and broadcast training at multi-site scale.</h1>
          <p className="lede">
            This build adds role-aware sessions, live event streaming, site and tenant visibility, connector management, discovery, NMOS awareness, and legacy control.
          </p>
        </div>
        <div className="heroMeta">
          <div className={`statusPill ${streamStatus === 'live' ? 'live' : 'warning'}`}>{streamStatus}</div>
          <div className="statusPill subtle">{session ? `${session.name} • ${session.role}` : 'Loading session'}</div>
          <Link href="/training" className="ghostButton">
            Open training hub
          </Link>
        </div>
      </section>

      <section className="kpiGrid">
        <article className="kpiCard">
          <span>Connected sites</span>
          <strong>{snapshot?.metrics.connectedSites ?? '--'}</strong>
          <small>{snapshot?.sites.length ?? 0} sites in current footprint</small>
        </article>
        <article className="kpiCard">
          <span>Connectors online</span>
          <strong>{snapshot?.metrics.connectedConnectors ?? '--'}</strong>
          <small>{snapshot?.connectors.length ?? 0} enterprise integrations</small>
        </article>
        <article className="kpiCard">
          <span>On-air services</span>
          <strong>{snapshot?.metrics.onAirServices ?? '--'}</strong>
          <small>{snapshot?.metrics.activeIncidents ?? 0} incidents currently active</small>
        </article>
        <article className="kpiCard">
          <span>Enterprise users</span>
          <strong>{filteredUsers.length}</strong>
          <small>{snapshot?.tenants.length ?? 0} tenants visible</small>
        </article>
        <article className="kpiCard">
          <span>Queued jobs</span>
          <strong>{snapshot?.metrics.queuedJobs ?? '--'}</strong>
          <small>Auditable command execution</small>
        </article>
        <article className="kpiCard">
          <span>Live studios</span>
          <strong>{snapshot?.metrics.liveStudios ?? '--'}</strong>
          <small>Hybrid OB + studio + cloud MCR</small>
        </article>
      </section>

      <section className="workspace" style={{ marginTop: 18 }}>
        <div className="primaryColumn">
          <section className="tabRow">
            {(Object.keys(workspaceCopy) as Workspace[]).map((key) => (
              <button
                key={key}
                type="button"
                className={workspace === key ? 'tab active' : 'tab'}
                onClick={() => setWorkspace(key)}
              >
                {workspaceCopy[key].label}
              </button>
            ))}
          </section>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">{workspaceCopy[workspace].label} workspace</p>
                <h2>{workspaceCopy[workspace].title}</h2>
              </div>
              <p className="lede" style={{ margin: 0, maxWidth: 520 }}>
                {workspaceCopy[workspace].summary}
              </p>
            </div>
          </article>

          {workspace === 'operator' && snapshot ? (
            <>
              <article className="panel controlCanvas">
                <div className="canvasTopbar">
                  <div className="canvasBrand">
                    <span className="canvasMark">NO</span>
                    <div>
                      <strong>Nexus Orchestrate</strong>
                      <small>Production workflow canvas</small>
                    </div>
                  </div>
                  <div className="canvasTabs">
                    <span className="canvasTab active">Live</span>
                    <span className="canvasTab">Routing</span>
                    <span className="canvasTab">Shading</span>
                    <span className="canvasTab">Monitoring</span>
                  </div>
                  <div className="canvasMeta">
                    <span className="statusPill live">ptp locked</span>
                    <span className="statusPill subtle">{productionClock} SAST</span>
                  </div>
                </div>

                <div className="canvasBody">
                  <aside className="canvasSidebar">
                    <div className="canvasSidebarSection">
                      <span className="canvasSidebarLabel">Control modes</span>
                      <button type="button" className="canvasSidebarItem active">Mosaic multiview</button>
                      <button type="button" className="canvasSidebarItem">Virtual switcher</button>
                      <button type="button" className="canvasSidebarItem">Camera shading</button>
                      <button type="button" className="canvasSidebarItem">Audio and video QC</button>
                      <button type="button" className="canvasSidebarItem">MCR continuity</button>
                    </div>
                    <div className="canvasSidebarSection">
                      <span className="canvasSidebarLabel">Health</span>
                      {snapshot.connectors.slice(0, 4).map((connector) => (
                        <div key={connector.id} className="healthLine">
                          <span className={connector.status === 'connected' ? 'healthDot online' : connector.status === 'degraded' ? 'healthDot degraded' : 'healthDot offline'} />
                          <small>{connector.name}</small>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="canvasWorkspace">
                    <section className="signalFlowStrip">
                      <div className="sectionMiniHeader">
                        <span>End-to-end workflow</span>
                        <small>Source to control to distribution</small>
                      </div>
                      <div className="signalFlowMap">
                        {signalFlowColumns.map((column) => (
                          <div key={column.label} className="flowColumn">
                            <span className="flowLabel">{column.label}</span>
                            {column.nodes.map((node) => (
                              <div key={node.label} className={`flowNode ${node.tone}`}>
                                {node.label}
                                <small>{node.detail}</small>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="canvasLower">
                      <section className="mosaicPanel">
                        <div className="sectionMiniHeader">
                          <span>Mosaic multiviewer</span>
                          <small>4 x 2 layout</small>
                        </div>
                        <div className="mosaicGrid">
                          {multiviewTiles.slice(0, 8).map((tile) => (
                            <article
                              key={`mosaic-${tile.id}`}
                              className={`mosaicTile ${tile.status === 'active' || tile.status === 'live' || tile.status === 'on-air' ? 'program' : tile.status === 'standby' || tile.status === 'ready' ? 'preview' : 'warning'}`}
                            >
                              <div className="mosaicPreview">
                                <span>{tile.meta}</span>
                                <strong>{tile.label}</strong>
                              </div>
                              <div className="mosaicLabel">
                                <small>{tile.detail}</small>
                                <span>{tile.status}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <aside className="canvasControlRail">
                        <article className="railPanel">
                          <div className="sectionMiniHeader">
                            <span>Camera shading</span>
                            <small>SLM and color</small>
                          </div>
                          <div className="railList">
                            {cameraShaders.map((camera) => (
                              <div key={camera.id} className="railRow">
                                <div>
                                  <strong>{camera.name}</strong>
                                  <small>
                                    {camera.venue} • {camera.shader}
                                  </small>
                                </div>
                                <div className="railMeta">
                                  <span>{camera.iris}</span>
                                  <span>{camera.white}</span>
                                  <span>{camera.gain}</span>
                                  <span>{camera.paint}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="railPanel">
                          <div className="sectionMiniHeader">
                            <span>AV monitoring</span>
                            <small>Audio and video confidence</small>
                          </div>
                          <div className="railList">
                            {avMonitoring.map((metric) => (
                              <div key={metric.label} className="railRow">
                                <div>
                                  <strong>{metric.label}</strong>
                                  <small>{metric.status}</small>
                                </div>
                                <span className={metric.status === 'watch' ? 'badge warning' : 'badge live'}>{metric.value}</span>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="railPanel">
                          <div className="sectionMiniHeader">
                            <span>Legacy SDI bridge</span>
                            <small>SDI to IP interop</small>
                          </div>
                          <div className="railList">
                            {snapshot.sdiBridges.map((bridge) => (
                              <div key={bridge.id} className="railRow">
                                <div>
                                  <strong>{bridge.name}</strong>
                                  <small>
                                    {bridge.mode} • {bridge.ioCount}
                                  </small>
                                </div>
                                <span className={bridge.status === 'online' ? 'badge live' : bridge.status === 'degraded' ? 'badge warning' : 'badge critical'}>
                                  {bridge.reference}
                                </span>
                              </div>
                            ))}
                          </div>
                        </article>

                        <article className="railPanel">
                          <div className="sectionMiniHeader">
                            <span>Virtual consoles</span>
                            <small>Control panels</small>
                          </div>
                          <div className="railList">
                            <div className="railRow">
                              <div>
                                <strong>Vision mixer</strong>
                                <small>{activeRoute?.source ?? 'Idle bus'}</small>
                              </div>
                              <button type="button" className="tinyButton protected">armed</button>
                            </div>
                            <div className="railRow">
                              <div>
                                <strong>Audio panel</strong>
                                <small>AES67 monitor path</small>
                              </div>
                              <button type="button" className="tinyButton">listen</button>
                            </div>
                            <div className="railRow">
                              <div>
                                <strong>MCR continuity</strong>
                                <small>{activeMcr?.name ?? 'Backup ready'}</small>
                              </div>
                              <button type="button" className="tinyButton">protect</button>
                            </div>
                          </div>
                        </article>
                      </aside>
                    </div>
                  </div>
                </div>
              </article>

              <article className="panel productionSurface">
                <div className="productionTopbar">
                  <div>
                    <p className="panelLabel">Production control room</p>
                    <h2>Nexus Orchestrate multiview and switcher surface</h2>
                  </div>
                  <div className="clockCluster">
                    <div className="clockCard">
                      <span>Clock</span>
                      <strong>{productionClock}</strong>
                    </div>
                    <div className="clockCard">
                      <span>Program</span>
                      <strong>{activeRoute?.source ?? 'Awaiting bus'}</strong>
                    </div>
                    <div className="clockCard">
                      <span>Preview</span>
                      <strong>{standbyRoute?.source ?? 'Awaiting source'}</strong>
                    </div>
                  </div>
                </div>

                <div className="productionGrid">
                  <section className="multiviewWall">
                    <div className="sectionMiniHeader">
                      <span>Multiview</span>
                      <small>{multiviewTiles.length} live windows</small>
                    </div>
                    <div className="multiviewGrid">
                      {multiviewTiles.map((tile) => (
                        <article key={tile.id} className={`multiviewTile ${tile.status === 'active' || tile.status === 'live' || tile.status === 'on-air' ? 'program' : tile.status === 'standby' || tile.status === 'ready' ? 'preview' : 'alert'}`}>
                          <div className="multiviewFrame">
                            <span className="multiviewTally">{tile.status}</span>
                            <strong>{tile.label}</strong>
                            <small>{tile.detail}</small>
                          </div>
                          <div className="multiviewFooter">
                            <span>{tile.meta}</span>
                            <span>{tile.id}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="switcherDeck">
                    <div className="sectionMiniHeader">
                      <span>Switcher deck</span>
                      <small>Take, route, and scenario control</small>
                    </div>
                    <div className="switcherBus">
                      <div className="busRow">
                        <span className="busLabel">Program</span>
                        <div className="busSources">
                          {snapshot.routes.map((route) => (
                            <button
                              key={`program-${route.id}`}
                              type="button"
                              className={route.state === 'active' ? 'sourceButton live' : 'sourceButton'}
                              onClick={() => void toggleRoute(route.id)}
                              disabled={busyAction === `route-${route.id}` || route.state === 'blocked'}
                            >
                              {route.source}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="busRow">
                        <span className="busLabel preview">Preview</span>
                        <div className="busSources">
                          {snapshot.routes.map((route) => (
                            <button
                              key={`preview-${route.id}`}
                              type="button"
                              className={route.state === 'standby' ? 'sourceButton preview' : 'sourceButton muted'}
                              onClick={() => void toggleRoute(route.id)}
                              disabled={busyAction === `route-${route.id}` || route.state === 'blocked'}
                            >
                              {route.destination}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                <div className="takeBar">
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => activeRoute && void toggleRoute(activeRoute.id)}
                        disabled={!activeRoute || busyAction === `route-${activeRoute?.id}`}
                      >
                        Take cut
                      </button>
                      <button
                        type="button"
                        className="ghostButton"
                        onClick={() => standbyRoute && void toggleRoute(standbyRoute.id)}
                        disabled={!standbyRoute || busyAction === `route-${standbyRoute?.id}`}
                      >
                        Take auto
                      </button>
                      <button
                        type="button"
                        className="ghostButton"
                        onClick={() => void runScenario('breaking-news')}
                        disabled={busyAction === 'scenario-breaking-news'}
                      >
                        Breaking mode
                      </button>
                    </div>
                    <div className="trainingMeta" style={{ marginTop: 16 }}>
                      <small>{currentProduction ? `Production: ${currentProduction.name}` : 'No production active'}</small>
                      <small>{currentProduction ? `${currentProduction.cameraCount} cameras • ${currentProduction.multiviewLayout}` : 'Configure a setup in admin'}</small>
                    </div>
                  </section>

                  <section className="consoleStack">
                    <article className="consolePanel">
                      <div className="sectionMiniHeader">
                        <span>Virtual console</span>
                        <small>{liveStudio?.name ?? 'No live studio'}</small>
                      </div>
                      <div className="consoleRows">
                        <div className="consoleRow">
                          <span>Director</span>
                          <strong>{activeRoute?.destination ?? 'Program bus pending'}</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Audio</span>
                          <strong>{snapshot.connectors.find((connector) => connector.type === 'Audio')?.name ?? 'Audio core offline'}</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Intercom</span>
                          <strong>Virtual keypanel linked</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Replay</span>
                          <strong>{snapshot.connectors.find((connector) => connector.type === 'Replay')?.name ?? 'Replay offline'}</strong>
                        </div>
                      </div>
                    </article>

                    <article className="consolePanel">
                      <div className="sectionMiniHeader">
                        <span>Master control</span>
                        <small>{activeMcr?.name ?? 'Standby chain'}</small>
                      </div>
                      <div className="consoleRows">
                        <div className="consoleRow">
                          <span>Playout</span>
                          <strong>{activeMcr?.playout ?? 'No playout chain'}</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Ingest</span>
                          <strong>{activeMcr?.ingest ?? 'No ingest path'}</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Compliance</span>
                          <strong>{activeMcr?.compliance ?? 'Pending compliance'}</strong>
                        </div>
                        <div className="consoleRow">
                          <span>Distribution</span>
                          <strong>{activeMcr?.distribution ?? 'Distribution idle'}</strong>
                        </div>
                      </div>
                    </article>
                  </section>
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Routing core</p>
                    <h2>Live source-to-destination control</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.routes.map((route) => (
                    <article key={route.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={route.state === 'active' ? 'badge live' : route.state === 'standby' ? 'badge standby' : 'badge critical'}>
                          {route.state}
                        </span>
                        <small>{route.transport}</small>
                      </div>
                      <h3>{route.source}</h3>
                      <p>
                        {route.destination} • {route.controller}
                      </p>
                      <div className="trainingMeta">
                        <small>{route.protected ? 'Protected flow' : 'Single path'}</small>
                        <small>Site {route.siteId}</small>
                      </div>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void toggleRoute(route.id)}
                        disabled={busyAction === `route-${route.id}` || route.state === 'blocked'}
                      >
                        {busyAction === `route-${route.id}` ? 'Switching...' : 'Toggle route'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Live scenarios</p>
                    <h2>Production event control</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.scenarios.map((scenario) => (
                    <article key={scenario.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={scenario.status === 'active' ? 'badge live' : 'badge standby'}>{scenario.status}</span>
                      </div>
                      <h3>{scenario.name}</h3>
                      <p>{scenario.description}</p>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void runScenario(scenario.slug)}
                        disabled={busyAction === `scenario-${scenario.slug}`}
                      >
                        {busyAction === `scenario-${scenario.slug}` ? 'Applying...' : 'Activate scenario'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Outside broadcast</p>
                    <h2>Remote venue contribution and studio assignment</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.obUnits.map((unit) => {
                    const assignedStudio = snapshot.virtualStudios.find((studio) => studio.id === unit.activeStudioId)

                    return (
                      <article key={unit.id} className="trainingCard">
                        <div className="trainingCardHeader">
                          <span className={unit.status === 'on-air' ? 'badge live' : unit.status === 'degraded' ? 'badge warning' : 'badge standby'}>
                            {unit.status}
                          </span>
                          <small>{unit.contribution}</small>
                        </div>
                        <h3>{unit.name}</h3>
                        <p>
                          {unit.venue} • {unit.latencyMs} ms contribution latency
                        </p>
                        <div className="trainingMeta">
                          <small>{assignedStudio ? `Assigned to ${assignedStudio.name}` : 'Unassigned to studio'}</small>
                          <small>{assignedStudio ? `MCR ${assignedStudio.mcrChainId}` : 'Awaiting control room routing'}</small>
                        </div>
                        <div className="buttonRow">
                          {snapshot.virtualStudios.slice(0, 3).map((studio) => (
                            <button
                              key={studio.id}
                              type="button"
                              className={unit.activeStudioId === studio.id ? 'ghostButton activeToggle' : 'ghostButton'}
                              onClick={() => void assignObToStudio(unit.id, studio.id)}
                              disabled={busyAction === `ob-${unit.id}-${studio.id}`}
                            >
                              {busyAction === `ob-${unit.id}-${studio.id}` ? 'Assigning...' : `Route to ${studio.name}`}
                            </button>
                          ))}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Virtual studio and MCR</p>
                    <h2>Hybrid cloud control rooms and master control readiness</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.virtualStudios.map((studio) => {
                    const site = snapshot.sites.find((item) => item.id === studio.siteId)
                    const chain = snapshot.mcrChains.find((item) => item.id === studio.mcrChainId)
                    const linkedUnits = snapshot.obUnits.filter((unit) => unit.activeStudioId === studio.id)

                    return (
                      <article key={studio.id} className="trainingCard">
                        <div className="trainingCardHeader">
                          <span className={studio.mode === 'live' ? 'badge live' : studio.mode === 'maintenance' ? 'badge warning' : 'badge standby'}>
                            {studio.mode}
                          </span>
                          <small>{studio.host}</small>
                        </div>
                        <h3>{studio.name}</h3>
                        <p>
                          {site?.name ?? 'Unknown site'} • {studio.operatorCount} operators
                        </p>
                        <div className="trainingMeta">
                          <small>{chain ? `${chain.name} • ${chain.status}` : 'No MCR chain attached'}</small>
                          <small>{linkedUnits.length > 0 ? `${linkedUnits.length} OB feed(s) linked` : 'No OB feeds linked'}</small>
                        </div>
                        <div className="trainingMeta">
                          <small>{chain?.playout ?? 'Playout pending'}</small>
                          <small>{chain?.distribution ?? 'Distribution pending'}</small>
                        </div>
                        <button
                          type="button"
                          className="ghostButton activeToggle"
                          onClick={() => void activateStudio(studio.id)}
                          disabled={busyAction === `studio-${studio.id}` || studio.mode === 'maintenance'}
                        >
                          {busyAction === `studio-${studio.id}` ? 'Promoting...' : studio.mode === 'live' ? 'Studio live' : 'Take live'}
                        </button>
                      </article>
                    )
                  })}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Operational workflows</p>
                    <h2>Show-control and recovery automations</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.workflows.map((workflow) => (
                    <article key={workflow.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={workflow.state === 'complete' ? 'badge live' : workflow.state === 'running' ? 'badge warning' : 'badge standby'}>
                          {workflow.state}
                        </span>
                        <small>{workflow.category}</small>
                      </div>
                      <h3>{workflow.name}</h3>
                      <p>{workflow.target}</p>
                      <div className="trainingMeta">
                        <small>Last run {workflow.lastRun}</small>
                      </div>
                      <button
                        type="button"
                        className="ghostButton"
                        onClick={() => void executeWorkflow(workflow.id)}
                        disabled={busyAction === `workflow-${workflow.id}`}
                      >
                        {busyAction === `workflow-${workflow.id}` ? 'Launching...' : 'Run workflow'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">On-air risks</p>
                    <h2>Alerts and operator attention</h2>
                  </div>
                </div>
                <div className="alertList">
                  {snapshot.alerts.map((alert) => (
                    <article key={alert.id} className={`alertCard ${alert.severity}`}>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.detail}</p>
                      </div>
                      <div className="alertFooter">
                        <span>{alert.severity}</span>
                        <button
                          type="button"
                          className="ghostButton"
                          onClick={() => void acknowledge(alert.id)}
                          disabled={alert.acknowledged || busyAction === `alert-${alert.id}`}
                        >
                          {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {workspace === 'engineer' && snapshot ? (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Site and device monitoring</p>
                    <h2>Engineering operations</h2>
                  </div>
                  <button type="button" className="ghostButton activeToggle" onClick={() => void discoverEquipment()} disabled={busyAction === 'discovery'}>
                    {busyAction === 'discovery' ? 'Scanning...' : 'Run discovery'}
                  </button>
                </div>
                <div className="siteGrid">
                  {snapshot.sites.map((site) => (
                    <article key={site.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={site.health === 'healthy' ? 'badge live' : site.health === 'watch' ? 'badge warning' : 'badge critical'}>
                          {site.health}
                        </span>
                        <small>{site.mode}</small>
                      </div>
                      <h3>{site.name}</h3>
                      <p>{site.location}</p>
                      <div className="trainingMeta">
                        <small>{site.activeServices} active services</small>
                        <small>PTP offset {site.ptpOffsetNs} ns</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Connectors</p>
                    <h2>Enterprise integrations</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.connectors.map((connector) => (
                    <article key={connector.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={connector.status === 'connected' ? 'badge live' : connector.status === 'degraded' ? 'badge warning' : 'badge critical'}>
                          {connector.status}
                        </span>
                        <small>{connector.type}</small>
                      </div>
                      <h3>{connector.name}</h3>
                      <p>
                        {connector.vendor} • {connector.protocol}
                      </p>
                      <div className="buttonRow">
                        <button type="button" className="ghostButton" onClick={() => void changeConnectorStatus(connector.id, 'connected')}>
                          Connect
                        </button>
                        <button type="button" className="ghostButton" onClick={() => void changeConnectorStatus(connector.id, 'degraded')}>
                          Degrade
                        </button>
                        <button type="button" className="ghostButton dangerButton" onClick={() => void changeConnectorStatus(connector.id, 'offline')}>
                          Offline
                        </button>
                        <button
                          type="button"
                          className="ghostButton activeToggle"
                          onClick={() =>
                            void runConnectorJob(
                              connector.id,
                              connector.type === 'GPIO'
                                ? 'pulse-gpio'
                                : connector.type === 'Cloud' || connector.type === 'Replay'
                                  ? 'run-workflow'
                                  : connector.type === 'Router' || connector.type === 'Audio'
                                    ? 'switch-route'
                                    : 'sync',
                            )
                          }
                          disabled={busyAction?.startsWith(`job-${connector.id}-`) === true}
                        >
                          Execute job
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">NMOS fabric</p>
                    <h2>Discovery and connection inventory</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.nmosFlows.map((flow) => (
                    <article key={flow.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className={flow.status === 'active' ? 'badge live' : flow.status === 'standby' ? 'badge standby' : 'badge warning'}>
                          {flow.status}
                        </span>
                        <small>{flow.mediaType}</small>
                      </div>
                      <h3>{flow.label}</h3>
                      <p>{flow.nodeId}</p>
                      <div className="trainingMeta">
                        <small>{flow.format}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Production monitoring</p>
                    <h2>Color shading, audio confidence, and SDI bridge health</h2>
                  </div>
                </div>
                <div className="manufacturerGrid">
                  <article className="manufacturerCard">
                    <div className="trainingCardHeader">
                      <span className="badge standby">color</span>
                      <small>camera shading and paint</small>
                    </div>
                    <div className="trainingMeta">
                      {snapshot.colorEngines.map((engine) => (
                        <small key={engine.id}>
                          {engine.camera} • {engine.paintProfile} • {engine.whiteBalanceK}K • {engine.gainDb} dB
                        </small>
                      ))}
                    </div>
                  </article>

                  <article className="manufacturerCard">
                    <div className="trainingCardHeader">
                      <span className="badge standby">audio</span>
                      <small>loudness and phase</small>
                    </div>
                    <div className="trainingMeta">
                      {snapshot.audioMonitors.map((monitor) => (
                        <small key={monitor.id}>
                          {monitor.zone} • {monitor.loudnessLufs} LUFS • {monitor.peakDbfs} dBFS • {monitor.phase}
                        </small>
                      ))}
                    </div>
                  </article>

                  <article className="manufacturerCard">
                    <div className="trainingCardHeader">
                      <span className="badge standby">bridge</span>
                      <small>legacy SDI integration</small>
                    </div>
                    <div className="trainingMeta">
                      {snapshot.sdiBridges.map((bridge) => (
                        <small key={bridge.id}>
                          {bridge.name} • {bridge.mode} • {bridge.ioCount} • {bridge.reference}
                        </small>
                      ))}
                    </div>
                  </article>
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Manufacturer ecosystem</p>
                    <h2>Supported broadcast equipment families</h2>
                  </div>
                </div>
                <div className="manufacturerGrid">
                  {manufacturerCatalog.map((maker) => (
                    <article key={maker.name} className="manufacturerCard">
                      <div className="trainingCardHeader">
                        <span className="badge standby">catalog</span>
                        <small>{maker.focus}</small>
                      </div>
                      <h3>{maker.name}</h3>
                      <div className="trainingMeta">
                        {maker.modules.map((module) => (
                          <small key={module}>{module}</small>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </>
          ) : null}

          {workspace === 'trainee' ? (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Trainee enablement</p>
                  <h2>Integrated curriculum and scenario practice</h2>
                </div>
              </div>
              <div className="trainingGrid">
                <article className="trainingCard">
                  <h3>Operator onboarding</h3>
                  <p>Use the training hub to walk through startup, switching, incident response, and shift handovers.</p>
                </article>
                <article className="trainingCard">
                  <h3>Engineer onboarding</h3>
                  <p>Learn discovery, connector health, NMOS behavior, monitoring posture, and GPIO intervention patterns.</p>
                </article>
                <article className="trainingCard">
                  <h3>Live simulation</h3>
                  <p>The same enterprise shell supports realistic scenario activation and event replay for drills.</p>
                </article>
              </div>
              <Link href="/training" className="ghostButton activeToggle" style={{ marginTop: 18, display: 'inline-flex' }}>
                Launch full curriculum
              </Link>
            </article>
          ) : null}

          {workspace === 'admin' && snapshot ? (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Tenants and sites</p>
                    <h2>Enterprise oversight</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.tenants.map((tenant) => (
                    <article key={tenant.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className="badge standby">{tenant.tier}</span>
                      </div>
                      <h3>{tenant.name}</h3>
                      <p>{tenant.region}</p>
                      <div className="trainingMeta">
                        <small>{snapshot.sites.filter((site) => site.tenantId === tenant.id).length} sites</small>
                        <small>{snapshot.users.filter((user) => user.tenantId === tenant.id).length} users</small>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Production database</p>
                    <h2>Saved setups and activation plans</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.productions.map((production) => {
                    const studio = snapshot.virtualStudios.find((item) => item.id === production.studioId)
                    const site = snapshot.sites.find((item) => item.id === production.siteId)

                    return (
                      <article key={production.id} className="trainingCard">
                        <div className="trainingCardHeader">
                          <span className={production.status === 'live' ? 'badge live' : production.status === 'ready' ? 'badge standby' : 'badge warning'}>
                            {production.status}
                          </span>
                          <small>{production.productionType}</small>
                        </div>
                        <h3>{production.name}</h3>
                        <p>
                          {site?.name ?? 'Unknown site'} • {studio?.name ?? 'No studio assigned'}
                        </p>
                        <div className="trainingMeta">
                          <small>{production.cameraCount} cameras • {production.multiviewLayout}</small>
                          <small>{production.audioProfile}</small>
                        </div>
                        <div className="trainingMeta">
                          <small>{production.graphicsProfile}</small>
                          <small>{production.redundancy} redundancy</small>
                        </div>
                        <p className="trainingText">{production.notes}</p>
                        <div className="buttonRow">
                          <button
                            type="button"
                            className="ghostButton activeToggle"
                            onClick={() => void applyProduction(production.id)}
                            disabled={busyAction === `production-${production.id}` || production.status === 'live'}
                          >
                            {busyAction === `production-${production.id}` ? 'Applying...' : production.status === 'live' ? 'Active setup' : 'Apply setup'}
                          </button>
                          <button
                            type="button"
                            className="ghostButton"
                            onClick={() => void cloneProduction(production)}
                            disabled={busyAction === `production-save-${production.id}`}
                          >
                            {busyAction === `production-save-${production.id}` ? 'Saving...' : 'Duplicate setup'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Role access</p>
                    <h2>Enterprise user switching</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {filteredUsers.map((user) => (
                    <article key={user.id} className="trainingCard">
                      <div className="trainingCardHeader">
                        <span className="badge standby">{user.role}</span>
                      </div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <button
                        type="button"
                        className="ghostButton activeToggle"
                        onClick={() => void loginAs(user.id)}
                        disabled={busyAction === `login-${user.id}`}
                      >
                        {busyAction === `login-${user.id}` ? 'Switching...' : 'Impersonate workspace'}
                      </button>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Master control chains</p>
                    <h2>Cloud and studio playout readiness</h2>
                  </div>
                </div>
                <div className="trainingGrid">
                  {snapshot.mcrChains.map((chain) => {
                    const studio = snapshot.virtualStudios.find((item) => item.id === chain.activeStudioId)

                    return (
                      <article key={chain.id} className="trainingCard">
                        <div className="trainingCardHeader">
                          <span className={chain.status === 'on-air' ? 'badge live' : chain.status === 'switching' ? 'badge warning' : 'badge standby'}>
                            {chain.status}
                          </span>
                          <small>{studio?.name ?? 'No studio live'}</small>
                        </div>
                        <h3>{chain.name}</h3>
                        <p>
                          {chain.playout} • {chain.ingest}
                        </p>
                        <div className="trainingMeta">
                          <small>{chain.compliance}</small>
                          <small>{chain.distribution}</small>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </article>
            </>
          ) : null}
        </div>

        <aside className="sideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Session</p>
                <h2>Current workspace user</h2>
              </div>
            </div>
            <div className="sessionCard">
              <strong>{session?.name ?? 'Loading user'}</strong>
              <p>{session?.email ?? 'Loading email'}</p>
              <span className="statusPill subtle">{session?.role ?? 'pending'}</span>
              <button type="button" className="ghostButton" onClick={() => void logout()} disabled={busyAction === 'logout'}>
                {busyAction === 'logout' ? 'Refreshing...' : 'Reset session'}
              </button>
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Active site</p>
                <h2>Primary context</h2>
              </div>
            </div>
            {activeSite ? (
              <div className="sessionCard">
                <strong>{activeSite.name}</strong>
                <p>{activeSite.location}</p>
                <span className={activeSite.health === 'healthy' ? 'statusPill live' : activeSite.health === 'watch' ? 'statusPill warning' : 'statusPill danger'}>
                  {activeSite.health}
                </span>
                <small>{activeSite.activeServices} services • PTP {activeSite.ptpOffsetNs} ns</small>
              </div>
            ) : (
              <p className="trainingText">Waiting for site data.</p>
            )}
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Event stream</p>
                <h2>Live enterprise audit</h2>
              </div>
            </div>
            <div className="eventList">
              {snapshot?.events.map((event) => (
                <div key={event.id} className="eventRow">
                  <span>{event.time}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Execution queue</p>
                <h2>Recent jobs</h2>
              </div>
            </div>
            <div className="alertList">
              {snapshot?.jobs.slice(0, 6).map((job) => (
                <article key={job.id} className="alertCard info">
                  <div>
                    <strong>{job.connectorName}</strong>
                    <p>
                      {job.action} • {job.result ?? 'Executing'}
                    </p>
                  </div>
                  <div className="alertFooter">
                    <span>{job.state}</span>
                    <small>{job.createdAt}</small>
                  </div>
                </article>
              ))}
            </div>
          </article>

          {workspace === 'engineer' && snapshot ? (
            <article className="panel compactPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">GPIO bridge</p>
                  <h2>Legacy control</h2>
                </div>
              </div>
              <div className="alertList">
                {snapshot.gpioPorts.map((port) => (
                  <article key={port.id} className="alertCard info">
                    <div>
                      <strong>{port.port}</strong>
                      <p>
                        {port.label} • {port.direction} • {port.deviceName}
                      </p>
                    </div>
                    <div className="alertFooter">
                      <span>{port.state === 1 ? 'High' : 'Low'}</span>
                      <button
                        type="button"
                        className={port.state === 1 ? 'ghostButton activeToggle' : 'ghostButton'}
                        onClick={() => void toggleGpio(port.id)}
                        disabled={busyAction === `gpio-${port.id}`}
                      >
                        {busyAction === `gpio-${port.id}` ? 'Switching...' : 'Toggle'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : null}
        </aside>
      </section>

      {error ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <p className="trainingText">Loading enterprise product state...</p>
        </section>
      ) : null}
    </main>
  )
}
