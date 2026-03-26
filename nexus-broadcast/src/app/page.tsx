'use client'

import { useEffect, useMemo, useState } from 'react'

type DeviceState = 'online' | 'degraded' | 'offline'
type Severity = 'info' | 'warning' | 'critical'
type AutomationState = 'idle' | 'running' | 'complete'
type FeedState = 'live' | 'standby' | 'warning'
type SimulationMode = 'steady' | 'busy' | 'incident'

type Device = {
  id: string
  name: string
  role: string
  location: string
  latencyMs: number
  load: number
  state: DeviceState
  backup: boolean
}

type Route = {
  id: string
  source: string
  destination: string
  protocol: string
  bitrate: string
  protected: boolean
}

type Automation = {
  id: string
  name: string
  summary: string
  eta: string
  owner: string
  state: AutomationState
  lastRun: string
}

type Alert = {
  id: string
  title: string
  detail: string
  severity: Severity
  acknowledged: boolean
}

type EventEntry = {
  id: string
  time: string
  title: string
  detail: string
}

type Feed = {
  id: string
  label: string
  location: string
  format: string
  audio: string
  state: FeedState
  viewers: number
}

type LiveMetrics = {
  throughputGbps: number
  jitterMs: number
  activeViewers: number
  syncNs: number
}

const initialDevices: Device[] = [
  { id: 'gw-jhb-01', name: 'Gateway JHB-01', role: 'ST 2110 Edge Gateway', location: 'Johannesburg', latencyMs: 3, load: 48, state: 'online', backup: true },
  { id: 'mv-cpt-02', name: 'Multiview CPT-02', role: 'Remote Production Core', location: 'Cape Town', latencyMs: 9, load: 62, state: 'online', backup: false },
  { id: 'enc-nbo-03', name: 'Encoder NBO-03', role: 'JPEG XS / SRT Encoder', location: 'Nairobi', latencyMs: 15, load: 71, state: 'degraded', backup: true },
  { id: 'pl-lon-04', name: 'Playout LON-04', role: 'Cloud FAST Channel Node', location: 'London', latencyMs: 24, load: 39, state: 'online', backup: true },
]

const initialRoutes: Route[] = [
  { id: 'route-a', source: 'Studio 1 Program', destination: 'Cloud Switcher A', protocol: 'ST 2110-20', bitrate: '3 Gbps', protected: true },
  { id: 'route-b', source: 'Commentary A', destination: 'Audio Mixer Core', protocol: 'AES67', bitrate: '512 Kbps', protected: true },
  { id: 'route-c', source: 'Contribution Feed', destination: 'OTT Headend', protocol: 'SRT', bitrate: '28 Mbps', protected: false },
]

const initialAutomations: Automation[] = [
  { id: 'auto-failover', name: 'Auto Failover', summary: 'Moves contribution feeds to backup encoders when transport jitter spikes.', eta: '< 4 sec', owner: 'Ops Core', state: 'idle', lastRun: '02:10 UTC' },
  { id: 'cloud-burst', name: 'Cloud Burst Spin-up', summary: 'Launches temporary cloud control room resources for overflow events.', eta: '90 sec', owner: 'Cloud Ops', state: 'idle', lastRun: 'Yesterday' },
  { id: 'fast-launch', name: 'FAST Channel Launch', summary: 'Builds a pop-up channel with graphics, SCTE markers, and distribution outputs.', eta: '6 min', owner: 'Digital Playout', state: 'complete', lastRun: 'Today' },
]

const initialAlerts: Alert[] = [
  { id: 'ptp-drift', title: 'PTP drift on Nairobi edge', detail: 'Clock offset crossed 850 ns threshold. Monitor grandmaster redundancy.', severity: 'warning', acknowledged: false },
  { id: 'fiber-path', title: 'Secondary fiber path unavailable', detail: '2022-7 protection has dropped to single-path for contribution route C.', severity: 'critical', acknowledged: false },
  { id: 'nmos-sync', title: 'NMOS registry refresh complete', detail: 'All senders and receivers resynchronized after topology update.', severity: 'info', acknowledged: true },
]

const initialEvents: EventEntry[] = [
  { id: 'event-1', time: '12:04:11', title: 'Backup encoder armed', detail: 'Encoder NBO-03 standby chain synced to route C.' },
  { id: 'event-2', time: '12:02:37', title: 'Cloud multiview opened', detail: 'Operator panel assigned to Cape Town production pod.' },
  { id: 'event-3', time: '11:59:03', title: 'Runbook completed', detail: 'Scheduled recording archive created for morning bulletin.' },
]

const initialFeeds: Feed[] = [
  { id: 'feed-1', label: 'Studio 1', location: 'Johannesburg', format: '1080p50 HDR', audio: '5.1 + M&E', state: 'live', viewers: 14 },
  { id: 'feed-2', label: 'Contribution', location: 'Nairobi', format: '1080i50', audio: 'Stereo', state: 'warning', viewers: 9 },
  { id: 'feed-3', label: 'Commentary', location: 'Cape Town', format: 'AES67', audio: 'Commentary A', state: 'standby', viewers: 6 },
  { id: 'feed-4', label: 'FAST Output', location: 'London', format: 'ABR Ladder', audio: 'Stereo + Alt', state: 'live', viewers: 21 },
]

const complianceChecks = [
  { standard: 'SMPTE ST 2110-20', description: 'Video essence transport active across primary and backup fabrics.', pass: true },
  { standard: 'SMPTE ST 2022-7', description: 'Dual-path protection enabled for two of three critical routes.', pass: false },
  { standard: 'AMWA NMOS IS-04', description: 'Registry heartbeat and discovery cache healthy.', pass: true },
  { standard: 'IEEE 1588 PTP', description: 'Grandmaster lock stable, edge drift requires attention in Nairobi.', pass: false },
]

const modeProfiles: Record<SimulationMode, LiveMetrics> = {
  steady: { throughputGbps: 7.8, jitterMs: 0.6, activeViewers: 38, syncNs: 124 },
  busy: { throughputGbps: 11.4, jitterMs: 1.3, activeViewers: 52, syncNs: 236 },
  incident: { throughputGbps: 9.2, jitterMs: 4.8, activeViewers: 41, syncNs: 880 },
}

const storageKey = 'nexus-orchestrate-state'

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const stored = window.localStorage.getItem(key)
    if (!stored) return

    try {
      setValue(JSON.parse(stored) as T)
    } catch {
      window.localStorage.removeItem(key)
    }
  }, [key])

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function randomDelta(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function severityLabel(severity: Severity) {
  if (severity === 'critical') return 'Critical'
  if (severity === 'warning') return 'Warning'
  return 'Info'
}

function feedStateLabel(state: FeedState) {
  if (state === 'warning') return 'Attention'
  if (state === 'standby') return 'Standby'
  return 'Live'
}

export default function NexusPage() {
  const [devices, setDevices] = usePersistentState<Device[]>(`${storageKey}-devices`, initialDevices)
  const [routes, setRoutes] = usePersistentState<Route[]>(`${storageKey}-routes`, initialRoutes)
  const [automations, setAutomations] = usePersistentState<Automation[]>(`${storageKey}-automations`, initialAutomations)
  const [alerts, setAlerts] = usePersistentState<Alert[]>(`${storageKey}-alerts`, initialAlerts)
  const [events, setEvents] = usePersistentState<EventEntry[]>(`${storageKey}-events`, initialEvents)
  const [feeds, setFeeds] = usePersistentState<Feed[]>(`${storageKey}-feeds`, initialFeeds)
  const [selectedView, setSelectedView] = useState<'overview' | 'control' | 'devices' | 'automation'>('overview')
  const [clock, setClock] = useState('')
  const [programSource, setProgramSource] = useState('Studio 1')
  const [previewSource, setPreviewSource] = useState('Contribution')
  const [selectedFeed, setSelectedFeed] = useState('feed-1')
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('steady')
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>(modeProfiles.steady)

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }).format(new Date()),
      )
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const profile = modeProfiles[simulationMode]
    setLiveMetrics(profile)
  }, [simulationMode])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDevices((current) =>
        current.map((device) => {
          const nextLoad = Math.max(22, Math.min(96, device.load + randomDelta(-5, 5) + (simulationMode === 'busy' ? 3 : simulationMode === 'incident' ? 6 : 0)))
          const nextLatency = Math.max(2, Math.min(42, device.latencyMs + randomDelta(-2, 2) + (simulationMode === 'incident' ? 3 : 0)))
          const nextState: DeviceState =
            nextLatency > 20 || nextLoad > 80 ? 'degraded' : device.state === 'offline' ? 'offline' : 'online'

          return { ...device, load: nextLoad, latencyMs: nextLatency, state: nextState }
        }),
      )

      setFeeds((current) =>
        current.map((feed) => {
          const viewerShift = simulationMode === 'busy' ? randomDelta(1, 4) : simulationMode === 'incident' ? randomDelta(-3, 1) : randomDelta(-1, 2)
          const viewers = Math.max(2, feed.viewers + viewerShift)
          const state =
            simulationMode === 'incident' && feed.id === 'feed-2'
              ? 'warning'
              : simulationMode === 'busy' && feed.id === 'feed-3'
                ? 'live'
                : feed.state

          return { ...feed, viewers, state }
        }),
      )

      setLiveMetrics((current) => {
        const profile = modeProfiles[simulationMode]
        return {
          throughputGbps: Number(Math.max(5.8, profile.throughputGbps + randomDelta(-7, 7) / 10).toFixed(1)),
          jitterMs: Number(Math.max(0.3, profile.jitterMs + randomDelta(-3, 4) / 10).toFixed(1)),
          activeViewers: Math.max(18, profile.activeViewers + randomDelta(-4, 6)),
          syncNs: Math.max(70, profile.syncNs + randomDelta(-55, 65)),
        }
      })
    }, 2500)

    return () => window.clearInterval(timer)
  }, [setDevices, setFeeds, simulationMode])

  const totals = useMemo(() => {
    const online = devices.filter((device) => device.state === 'online').length
    const degraded = devices.filter((device) => device.state === 'degraded').length
    const protectedRoutes = routes.filter((route) => route.protected).length
    const activeAutomations = automations.filter((automation) => automation.state === 'running').length

    return { online, degraded, protectedRoutes, activeAutomations }
  }, [automations, devices, routes])

  const selectedFeedData = feeds.find((feed) => feed.id === selectedFeed) ?? feeds[0]

  const addEvent = (title: string, detail: string) => {
    const time = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())

    setEvents((current) => [{ id: `${Date.now()}-${Math.random()}`, time, title, detail }, ...current].slice(0, 10))
  }

  const addOrUpdateAlert = (alert: Alert) => {
    setAlerts((current) => {
      const exists = current.some((item) => item.id === alert.id)
      if (exists) {
        return current.map((item) => (item.id === alert.id ? alert : item))
      }
      return [alert, ...current].slice(0, 6)
    })
  }

  const setProgramFromFeed = (feed: Feed) => {
    setProgramSource(feed.label)
    addEvent('Program source changed', `${feed.label} is now on program output.`)
  }

  const setPreviewFromFeed = (feed: Feed) => {
    setPreviewSource(feed.label)
    addEvent('Preview source changed', `${feed.label} is now loaded on preview.`)
  }

  const triggerScenario = (mode: SimulationMode) => {
    setSimulationMode(mode)

    if (mode === 'steady') {
      addEvent('Simulation normalized', 'Traffic returned to steady-state operations.')
      return
    }

    if (mode === 'busy') {
      addEvent('Peak traffic mode', 'Additional cloud operators and multiview sessions came online.')
      addOrUpdateAlert({
        id: 'peak-traffic',
        title: 'High demand event active',
        detail: 'Viewer demand and cloud orchestration load increased across primary services.',
        severity: 'info',
        acknowledged: false,
      })
      return
    }

    addEvent('Incident simulation', 'Contribution chain entered protection mode after path instability.')
    addOrUpdateAlert({
      id: 'incident-mode',
      title: 'Transport instability detected',
      detail: 'Jitter exceeded profile threshold and Nexus shifted attention to contribution recovery.',
      severity: 'critical',
      acknowledged: false,
    })
  }

  const reactiveRecover = () => {
    setSimulationMode('steady')
    setRoutes((current) => current.map((route) => ({ ...route, protected: true })))
    setDevices((current) =>
      current.map((device) => ({
        ...device,
        backup: true,
        state: device.id === 'enc-nbo-03' ? 'online' : device.state === 'offline' ? 'degraded' : 'online',
        latencyMs: Math.max(3, device.latencyMs - 4),
      })),
    )
    setFeeds((current) => current.map((feed) => (feed.id === 'feed-2' ? { ...feed, state: 'live' } : feed)))
    addEvent('Reactive recovery executed', 'Protection restored, backup paths armed, and contribution feed stabilized.')
  }

  const toggleRouteProtection = (routeId: string) => {
    setRoutes((current) =>
      current.map((route) => {
        if (route.id !== routeId) return route
        const protectedValue = !route.protected
        addEvent(
          protectedValue ? 'Protection enabled' : 'Protection disabled',
          `${route.source} to ${route.destination} is now ${protectedValue ? 'protected by ST 2022-7' : 'running single-path'}.`,
        )
        return { ...route, protected: protectedValue }
      }),
    )
  }

  const toggleBackup = (deviceId: string) => {
    setDevices((current) =>
      current.map((device) => {
        if (device.id !== deviceId) return device
        const backup = !device.backup
        addEvent(backup ? 'Backup enabled' : 'Backup disabled', `${device.name} redundancy has been ${backup ? 'armed' : 'disarmed'}.`)
        return { ...device, backup }
      }),
    )
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((current) =>
      current.map((alert) => {
        if (alert.id !== alertId || alert.acknowledged) return alert
        addEvent('Alert acknowledged', alert.title)
        return { ...alert, acknowledged: true }
      }),
    )
  }

  const acknowledgeAll = () => {
    setAlerts((current) => current.map((alert) => ({ ...alert, acknowledged: true })))
    addEvent('Bulk acknowledgement', 'Operator acknowledged all active alerts.')
  }

  const runAutomation = (automationId: string) => {
    const selected = automations.find((automation) => automation.id === automationId)
    if (!selected || selected.state === 'running') return

    setAutomations((current) =>
      current.map((automation) =>
        automation.id === automationId ? { ...automation, state: 'running', lastRun: 'Running now' } : automation,
      ),
    )
    addEvent('Runbook started', `${selected.name} launched by operator.`)

    window.setTimeout(() => {
      setAutomations((current) =>
        current.map((automation) =>
          automation.id === automationId ? { ...automation, state: 'complete', lastRun: 'Just now' } : automation,
        ),
      )
      addEvent('Runbook completed', `${selected.name} finished successfully.`)
    }, 2200)
  }

  const swapProgramPreview = () => {
    setProgramSource(previewSource)
    setPreviewSource(programSource)
    addEvent('Program/Preview swapped', `${previewSource} moved to Program, ${programSource} moved to Preview.`)
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Nexus Broadcast Orchestrate</p>
          <h1>Pressable, reactive broadcast control with real-time simulation across cloud and ground operations.</h1>
          <p className="lede">
            Switch feeds, simulate incidents, watch telemetry react live, and run recovery workflows from a single responsive control room.
          </p>
        </div>
        <div className="heroMeta">
          <div className={`statusPill ${simulationMode === 'incident' ? 'danger' : simulationMode === 'busy' ? 'warning' : 'live'}`}>
            {simulationMode} mode
          </div>
          <div className="statusPill subtle">{clock || 'Syncing clock...'}</div>
        </div>
      </section>

      <section className="kpiGrid">
        <article className="kpiCard">
          <span>Fabric throughput</span>
          <strong>{liveMetrics.throughputGbps} Gbps</strong>
          <small>Jitter {liveMetrics.jitterMs} ms</small>
        </article>
        <article className="kpiCard">
          <span>Online devices</span>
          <strong>{totals.online}</strong>
          <small>{totals.degraded} degraded nodes need attention</small>
        </article>
        <article className="kpiCard">
          <span>Protected routes</span>
          <strong>
            {totals.protectedRoutes}/{routes.length}
          </strong>
          <small>PTP sync offset {liveMetrics.syncNs} ns</small>
        </article>
        <article className="kpiCard">
          <span>Control sessions</span>
          <strong>{liveMetrics.activeViewers}</strong>
          <small>Program: {programSource}</small>
        </article>
      </section>

      <section className="tabRow" aria-label="Workspace views">
        {[
          ['overview', 'Overview'],
          ['control', 'Control Room'],
          ['devices', 'Devices'],
          ['automation', 'Automation'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={selectedView === value ? 'tab active' : 'tab'}
            onClick={() => setSelectedView(value as typeof selectedView)}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="workspace">
        <div className="primaryColumn">
          {(selectedView === 'overview' || selectedView === 'control') && (
            <>
              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Live simulation</p>
                    <h2>Operator reactions</h2>
                  </div>
                  <div className="buttonRow">
                    <button type="button" className="ghostButton" onClick={() => triggerScenario('steady')}>
                      Steady state
                    </button>
                    <button type="button" className="ghostButton" onClick={() => triggerScenario('busy')}>
                      Peak event
                    </button>
                    <button type="button" className="ghostButton dangerButton" onClick={() => triggerScenario('incident')}>
                      Incident
                    </button>
                    <button type="button" className="ghostButton activeToggle" onClick={reactiveRecover}>
                      Auto recover
                    </button>
                  </div>
                </div>
                <div className="simulationGrid">
                  <div className="simulationCard">
                    <span>Preview</span>
                    <strong>{previewSource}</strong>
                    <small>Ready for take</small>
                  </div>
                  <div className="simulationCard emphasis">
                    <span>Program</span>
                    <strong>{programSource}</strong>
                    <small>Primary linear and OTT output</small>
                  </div>
                  <div className="simulationCard">
                    <span>Reaction</span>
                    <strong>{simulationMode === 'incident' ? 'Containment active' : simulationMode === 'busy' ? 'Scaling resources' : 'Nominal routing'}</strong>
                    <small>Telemetry adjusts every 2.5 seconds</small>
                  </div>
                </div>
              </article>

              <article className="panel">
                <div className="panelHeader">
                  <div>
                    <p className="panelLabel">Pressable multiview</p>
                    <h2>Take sources live</h2>
                  </div>
                  <button type="button" className="ghostButton" onClick={swapProgramPreview}>
                    Swap program / preview
                  </button>
                </div>
                <div className="feedGrid">
                  {feeds.map((feed) => (
                    <button
                      key={feed.id}
                      type="button"
                      className={selectedFeed === feed.id ? 'feedTile selected' : 'feedTile'}
                      onClick={() => setSelectedFeed(feed.id)}
                    >
                      <div className="feedTileHeader">
                        <span className={`badge ${feed.state}`}>{feedStateLabel(feed.state)}</span>
                        <small>{feed.viewers} sessions</small>
                      </div>
                      <strong>{feed.label}</strong>
                      <p>
                        {feed.location} • {feed.format}
                      </p>
                      <small>{feed.audio}</small>
                    </button>
                  ))}
                </div>
                <div className="selectionBar">
                  <div>
                    <span className="panelLabel">Selected source</span>
                    <strong>{selectedFeedData.label}</strong>
                    <p>
                      {selectedFeedData.location} • {selectedFeedData.format} • {selectedFeedData.audio}
                    </p>
                  </div>
                  <div className="buttonRow">
                    <button type="button" className="ghostButton" onClick={() => setPreviewFromFeed(selectedFeedData)}>
                      Load to preview
                    </button>
                    <button type="button" className="ghostButton activeToggle" onClick={() => setProgramFromFeed(selectedFeedData)}>
                      Take to air
                    </button>
                  </div>
                </div>
              </article>
            </>
          )}

          {(selectedView === 'overview' || selectedView === 'devices') && (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Edge + cloud inventory</p>
                  <h2>Device health</h2>
                </div>
              </div>
              <div className="deviceList">
                {devices.map((device) => (
                  <div className="deviceCard" key={device.id}>
                    <div className="deviceIdentity">
                      <div className={`healthDot ${device.state}`} />
                      <div>
                        <strong>{device.name}</strong>
                        <p>
                          {device.role} • {device.location}
                        </p>
                      </div>
                    </div>
                    <div className="deviceStats">
                      <span>Latency {device.latencyMs} ms</span>
                      <span>Load {device.load}%</span>
                    </div>
                    <button type="button" className={device.backup ? 'ghostButton activeToggle' : 'ghostButton'} onClick={() => toggleBackup(device.id)}>
                      {device.backup ? 'Backup armed' : 'Arm backup'}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          {(selectedView === 'overview' || selectedView === 'automation') && (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelLabel">Routing + runbooks</p>
                  <h2>Automation engine</h2>
                </div>
              </div>
              <div className="routeList">
                {routes.map((route) => (
                  <div key={route.id} className="routeCard">
                    <div>
                      <p>{route.source}</p>
                      <span>
                        {route.destination} via {route.protocol}
                      </span>
                    </div>
                    <div className="routeMeta">
                      <small>{route.bitrate}</small>
                      <button type="button" className={route.protected ? 'tinyButton protected' : 'tinyButton'} onClick={() => toggleRouteProtection(route.id)}>
                        {route.protected ? 'Protected' : 'Single path'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="automationGrid">
                {automations.map((automation) => (
                  <div className="automationCard" key={automation.id}>
                    <div className="automationHeader">
                      <strong>{automation.name}</strong>
                      <span className={`statusPill ${automation.state === 'running' ? 'warning' : automation.state === 'complete' ? 'live' : 'subtle'}`}>
                        {automation.state}
                      </span>
                    </div>
                    <p>{automation.summary}</p>
                    <div className="automationMeta">
                      <small>ETA {automation.eta}</small>
                      <small>Owner {automation.owner}</small>
                      <small>Last run {automation.lastRun}</small>
                    </div>
                    <button type="button" className="ghostButton" onClick={() => runAutomation(automation.id)}>
                      {automation.state === 'running' ? 'Running...' : 'Execute runbook'}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="sideColumn">
          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Alerting</p>
                <h2>Operations alerts</h2>
              </div>
              <button type="button" className="ghostButton" onClick={acknowledgeAll}>
                Ack all
              </button>
            </div>
            <div className="alertList">
              {alerts.map((alert) => (
                <div className={`alertCard ${alert.severity}`} key={alert.id}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail}</p>
                  </div>
                  <div className="alertFooter">
                    <span>{severityLabel(alert.severity)}</span>
                    <button type="button" className="ghostButton" onClick={() => acknowledgeAlert(alert.id)} disabled={alert.acknowledged}>
                      {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Compliance</p>
                <h2>Standards posture</h2>
              </div>
            </div>
            <div className="complianceList">
              {complianceChecks.map((check) => (
                <div className="complianceRow" key={check.standard}>
                  <div>
                    <strong>{check.standard}</strong>
                    <p>{check.description}</p>
                  </div>
                  <span className={check.pass ? 'statusPill live' : 'statusPill warning'}>{check.pass ? 'Pass' : 'Action needed'}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel compactPanel">
            <div className="panelHeader">
              <div>
                <p className="panelLabel">Audit trail</p>
                <h2>Recent events</h2>
              </div>
            </div>
            <div className="eventList">
              {events.map((event) => (
                <div className="eventRow" key={event.id}>
                  <span>{event.time}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  )
}
