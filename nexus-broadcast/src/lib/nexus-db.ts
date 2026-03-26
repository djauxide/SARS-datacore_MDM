import type {
  AlertRecord,
  ConnectorRecord,
  EquipmentRecord,
  EventRecord,
  GpioRecord,
  JobRecord,
  NmosFlowRecord,
  NmosNodeRecord,
  PlatformSnapshot,
  RouteRecord,
  RunbookRecord,
  ScenarioRecord,
  SiteRecord,
  TenantRecord,
  UserRecord,
  WorkflowRecord,
} from './types'
import { executeConnectorAction, type AdapterAction } from './adapters'
import { createStore } from './store'

type PersistedState = {
  tenants: TenantRecord[]
  sites: SiteRecord[]
  users: UserRecord[]
  connectors: ConnectorRecord[]
  routes: RouteRecord[]
  workflows: WorkflowRecord[]
  jobs: JobRecord[]
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  nmosFlows: NmosFlowRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
}

function nowIso() {
  return new Date().toISOString()
}

function nowClock() {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date())
}

function seedState(): PersistedState {
  const seen = nowIso()
  return {
    tenants: [
      { id: 1, name: 'Nexus Sports Group', region: 'EMEA', tier: 'Enterprise' },
      { id: 2, name: 'Nexus Training Academy', region: 'Global', tier: 'Training' },
    ],
    sites: [
      { id: 101, tenantId: 1, name: 'Johannesburg HQ', location: 'Johannesburg', mode: 'Production', health: 'healthy', activeServices: 12, ptpOffsetNs: 126 },
      { id: 102, tenantId: 1, name: 'Cape Town Production', location: 'Cape Town', mode: 'Production', health: 'healthy', activeServices: 8, ptpOffsetNs: 174 },
      { id: 103, tenantId: 1, name: 'Nairobi Edge', location: 'Nairobi', mode: 'Backup', health: 'watch', activeServices: 4, ptpOffsetNs: 812 },
      { id: 201, tenantId: 2, name: 'Training Lab', location: 'Remote', mode: 'Training', health: 'healthy', activeServices: 3, ptpOffsetNs: 144 },
    ],
    users: [
      { id: 1, name: 'Amina Khumalo', email: 'amina@nexus.local', role: 'admin', tenantId: 1, siteId: 101 },
      { id: 2, name: 'Thabo Maseko', email: 'thabo@nexus.local', role: 'operator', tenantId: 1, siteId: 101 },
      { id: 3, name: 'Lerato Dlamini', email: 'lerato@nexus.local', role: 'engineer', tenantId: 1, siteId: 103 },
      { id: 4, name: 'Neo Jacobs', email: 'neo@nexus.local', role: 'trainee', tenantId: 2, siteId: 201 },
    ],
    connectors: [
      { id: 1, siteId: 101, name: 'NMOS Registry Core', type: 'NMOS', vendor: 'Nexus', status: 'connected', protocol: 'IS-04 / IS-05', lastSync: seen },
      { id: 2, siteId: 101, name: 'GV Router Bridge', type: 'Router', vendor: 'Grass Valley', status: 'connected', protocol: 'GV Native + GPIO', lastSync: seen },
      { id: 3, siteId: 103, name: 'EVS Neuron Gateway', type: 'Replay', vendor: 'EVS', status: 'degraded', protocol: 'Neuron + NMOS', lastSync: seen },
      { id: 4, siteId: 102, name: 'Lawo Audio Core', type: 'Audio', vendor: 'Lawo', status: 'connected', protocol: 'AES67 + Ember+', lastSync: seen },
      { id: 5, siteId: 101, name: 'Cloud Burst Control', type: 'Cloud', vendor: 'Nexus', status: 'connected', protocol: 'HTTPS + WebSocket', lastSync: seen },
      { id: 6, siteId: 101, name: 'Legacy GPIO Rack', type: 'GPIO', vendor: 'Grass Valley', status: 'connected', protocol: 'GPI/GPO', lastSync: seen },
    ],
    routes: [
      { id: 1, source: 'Studio 1 Program', destination: 'Cloud Switcher A', siteId: 101, controller: 'GV Router Bridge', transport: 'ST 2110-20', state: 'active', protected: true },
      { id: 2, source: 'Replay A', destination: 'Program Bus B', siteId: 101, controller: 'EVS Neuron Gateway', transport: 'ST 2110-22', state: 'standby', protected: true },
      { id: 3, source: 'Commentary A', destination: 'Audio Core', siteId: 102, controller: 'Lawo Audio Core', transport: 'AES67', state: 'active', protected: false },
      { id: 4, source: 'Breaking News Feed', destination: 'FAST Output', siteId: 103, controller: 'Cloud Burst Control', transport: 'SRT', state: 'blocked', protected: true },
    ],
    workflows: [
      { id: 1, name: 'Provision Remote Gallery', category: 'provisioning', target: 'Cloud Burst Control', state: 'idle', lastRun: 'Today 10:14' },
      { id: 2, name: 'Failover Contribution Path', category: 'failover', target: 'EVS Neuron Gateway', state: 'idle', lastRun: 'Today 09:22' },
      { id: 3, name: 'Validate NMOS Connections', category: 'compliance', target: 'NMOS Registry Core', state: 'complete', lastRun: 'Today 11:06' },
      { id: 4, name: 'Show Start Macro', category: 'show-control', target: 'GV Router Bridge', state: 'idle', lastRun: 'Yesterday 18:32' },
    ],
    equipment: [
      { id: 1, name: 'JHB Core Router', vendor: 'Nexus', model: 'NXR-128', role: 'Video Router', facility: 'Johannesburg HQ', status: 'online', protocols: ['ST 2110', 'NMOS IS-05', 'GPIO'], cpuLoad: 39, temperature: 46, latencyMs: 2, lastSeen: seen },
      { id: 2, name: 'Cape Town Multiview', vendor: 'Nexus', model: 'MV-16', role: 'Multiviewer', facility: 'Cape Town Production', status: 'online', protocols: ['ST 2110', 'WebRTC'], cpuLoad: 54, temperature: 51, latencyMs: 7, lastSeen: seen },
      { id: 3, name: 'Neuron Bridge 01', vendor: 'EVS', model: 'Neuron', role: 'Gateway', facility: 'Nairobi Edge', status: 'degraded', protocols: ['ST 2022-7', 'SRT', 'NMOS IS-04'], cpuLoad: 71, temperature: 63, latencyMs: 16, lastSeen: seen },
      { id: 4, name: 'Legacy GPIO Rack', vendor: 'Grass Valley', model: 'Encore GPIO', role: 'Legacy Interface', facility: 'Johannesburg HQ', status: 'online', protocols: ['GPI', 'GPO', 'RS-422'], cpuLoad: 18, temperature: 33, latencyMs: 3, lastSeen: seen },
      { id: 5, name: 'AMPP Burst Pod', vendor: 'GV', model: 'AMPP Edge', role: 'Cloud Production Pod', facility: 'AWS eu-west-2', status: 'online', protocols: ['ST 2110-22', 'NMOS IS-04', 'HTTPS'], cpuLoad: 58, temperature: 42, latencyMs: 23, lastSeen: seen },
    ],
    nmosNodes: [
      { id: 1, label: 'Studio 1 Program Sender', nodeId: 'node-jhb-program', kind: 'sender', transport: 'urn:x-nmos:transport:rtp', subscription: 'Program / Cloud Switcher', status: 'registered' },
      { id: 2, label: 'Contribution Feed Receiver', nodeId: 'node-cpt-receiver', kind: 'receiver', transport: 'urn:x-nmos:transport:srt', subscription: 'Contribution / Cape Town', status: 'registered' },
      { id: 3, label: 'Legacy Tally Bridge', nodeId: 'node-gpio-tally', kind: 'node', transport: 'urn:x-nmos:transport:dash', subscription: 'GPIO / Tally', status: 'warning' },
      { id: 4, label: 'FAST Channel Sender', nodeId: 'node-fast-output', kind: 'sender', transport: 'urn:x-nmos:transport:websocket', subscription: 'FAST / OTT', status: 'registered' },
    ],
    nmosFlows: [
      { id: 1, nodeId: 'node-jhb-program', label: 'Studio 1 Video', mediaType: 'video', format: 'video/raw; sampling=YCbCr-4:2:2', status: 'active' },
      { id: 2, nodeId: 'node-cpt-receiver', label: 'Commentary Main', mediaType: 'audio', format: 'audio/L24; rate=48000; channels=2', status: 'active' },
      { id: 3, nodeId: 'node-gpio-tally', label: 'Tally Event Stream', mediaType: 'anc', format: 'application/json', status: 'warning' },
      { id: 4, nodeId: 'node-fast-output', label: 'FAST ABR Program', mediaType: 'video', format: 'video/smpte291', status: 'standby' },
    ],
    gpioPorts: [
      { id: 1, port: 'GPI-01', label: 'Studio Red Button', direction: 'GPI', state: 0, deviceName: 'Legacy GPIO Rack' },
      { id: 2, port: 'GPI-02', label: 'Fire Alarm Interlock', direction: 'GPI', state: 0, deviceName: 'Legacy GPIO Rack' },
      { id: 3, port: 'GPO-01', label: 'On Air Tally', direction: 'GPO', state: 1, deviceName: 'Legacy GPIO Rack' },
      { id: 4, port: 'GPO-02', label: 'Backup Router Trigger', direction: 'GPO', state: 0, deviceName: 'Legacy GPIO Rack' },
    ],
    alerts: [
      { id: 1, title: 'Nairobi gateway experiencing elevated jitter', detail: 'Failover is armed but contribution latency is above baseline.', severity: 'warning', acknowledged: false },
      { id: 2, title: 'Single NMOS subscription needs review', detail: 'Legacy Tally Bridge is registered but transport mapping is incomplete.', severity: 'info', acknowledged: false },
    ],
    scenarios: [
      { id: 1, slug: 'champions-league', name: 'Major Sports Event', description: 'High-density live event with multiple commentary and contribution paths.', status: 'ready' },
      { id: 2, slug: 'breaking-news', name: 'Breaking News Cut-in', description: 'Rapid route changes with fast tally and automated cloud gallery spin-up.', status: 'ready' },
      { id: 3, slug: 'disaster-recovery', name: 'Disaster Recovery', description: 'Primary fabric impairment with backup path promotion and GPIO triggers.', status: 'ready' },
    ],
    runbooks: [
      { id: 1, name: 'Auto Failover', purpose: 'Promote protected paths and backup encoders.', eta: '< 4 sec', state: 'idle' },
      { id: 2, name: 'Cloud Gallery Spin-up', purpose: 'Create extra operator and replay capacity.', eta: '90 sec', state: 'idle' },
      { id: 3, name: 'Legacy Tally Sync', purpose: 'Align GPIO tally and program bus status.', eta: '12 sec', state: 'complete' },
    ],
    jobs: [],
    events: [
      { id: 1, time: nowClock(), title: 'Enterprise datastore initialized', detail: 'Nexus seeded tenants, sites, connectors, discovery, and operational state.' },
      { id: 2, time: nowClock(), title: 'NMOS registry linked', detail: 'Initial simulated device registration completed.' },
    ],
  }
}

function normalizeState(raw: Partial<PersistedState>): PersistedState {
  const seeded = seedState()

  return {
    tenants: raw.tenants ?? seeded.tenants,
    sites: raw.sites ?? seeded.sites,
    users: raw.users ?? seeded.users,
    connectors: raw.connectors ?? seeded.connectors,
    routes: raw.routes ?? seeded.routes,
    workflows: raw.workflows ?? seeded.workflows,
    jobs: raw.jobs ?? seeded.jobs,
    equipment: raw.equipment ?? seeded.equipment,
    nmosNodes: raw.nmosNodes ?? seeded.nmosNodes,
    nmosFlows: raw.nmosFlows ?? seeded.nmosFlows,
    gpioPorts: raw.gpioPorts ?? seeded.gpioPorts,
    alerts: raw.alerts ?? seeded.alerts,
    scenarios: raw.scenarios ?? seeded.scenarios,
    runbooks: raw.runbooks ?? seeded.runbooks,
    events: raw.events ?? seeded.events,
  }
}

async function readState() {
  const store = await createStore<PersistedState>(seedState)
  const raw = await store.read()
  return normalizeState(raw)
}

async function writeState(state: PersistedState) {
  const store = await createStore<PersistedState>(seedState)
  await store.write(state)
}

function addEvent(state: PersistedState, title: string, detail: string) {
  state.events = [{ id: Date.now(), time: nowClock(), title, detail }, ...state.events].slice(0, 16)
}

function refreshTelemetry(state: PersistedState) {
  state.equipment = state.equipment.map((item, index) => {
    const cpuLoad = Math.max(12, Math.min(93, item.cpuLoad + (index % 2 === 0 ? 2 : -2)))
    const temperature = Math.max(28, Math.min(70, item.temperature + (index % 3) - 1))
    const latencyMs = Math.max(2, Math.min(32, item.latencyMs + (index % 2 === 0 ? 1 : -1)))
    const status = latencyMs > 18 || cpuLoad > 80 ? 'degraded' : item.status === 'offline' ? 'offline' : 'online'
    return { ...item, cpuLoad, temperature, latencyMs, status, lastSeen: nowIso() }
  })

  state.sites = state.sites.map((site, index) => {
    const ptpOffsetNs = Math.max(92, Math.min(1200, site.ptpOffsetNs + (index % 2 === 0 ? 12 : -9)))
    const health =
      ptpOffsetNs > 700 ? 'critical' : ptpOffsetNs > 280 || site.mode === 'Backup' ? 'watch' : 'healthy'
    return { ...site, ptpOffsetNs, health, activeServices: Math.max(1, site.activeServices + (index % 3) - 1) }
  })

  state.connectors = state.connectors.map((connector, index) => {
    const status = connector.name === 'EVS Neuron Gateway' && index % 2 === 0 ? 'degraded' : connector.status === 'offline' ? 'offline' : 'connected'
    return { ...connector, status, lastSync: nowIso() }
  })

  state.routes = state.routes.map((route, index) => ({
    ...route,
    state:
      route.destination === 'FAST Output' && state.connectors.some((connector) => connector.name === 'Cloud Burst Control' && connector.status !== 'connected')
        ? 'blocked'
        : index % 3 === 0
          ? 'active'
          : route.state === 'blocked'
            ? 'standby'
            : route.state,
  }))
}

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const state = await readState()
  refreshTelemetry(state)
  await writeState(state)

  return {
    generatedAt: nowIso(),
    facilities: Array.from(new Set(state.equipment.map((item) => item.facility))),
    tenants: state.tenants,
    sites: state.sites,
    users: state.users,
    connectors: state.connectors,
    routes: state.routes,
    workflows: state.workflows,
    metrics: {
      onAirServices: state.equipment.filter((item) => item.status === 'online').length,
      activeIncidents: state.alerts.filter((item) => !item.acknowledged && item.severity !== 'info').length,
      registeredNmosNodes: state.nmosNodes.filter((item) => item.status === 'registered').length,
      protectedFlows: state.scenarios.filter((item) => item.status === 'active').length,
      gpioActive: state.gpioPorts.filter((item) => item.state === 1).length,
      connectedSites: state.sites.filter((item) => item.health !== 'critical').length,
      connectedConnectors: state.connectors.filter((item) => item.status === 'connected').length,
      queuedJobs: state.jobs.filter((item) => item.state === 'queued' || item.state === 'running').length,
    },
    equipment: state.equipment,
    nmosNodes: state.nmosNodes,
    nmosFlows: state.nmosFlows,
    gpioPorts: state.gpioPorts,
    alerts: state.alerts,
    scenarios: state.scenarios,
    runbooks: state.runbooks,
    jobs: state.jobs,
    events: state.events,
  }
}

export async function getUsers() {
  return (await readState()).users
}

export async function triggerScenario(slug: string) {
  const state = await readState()
  state.scenarios = state.scenarios.map((scenario) => ({ ...scenario, status: scenario.slug === slug ? 'active' : 'ready' }))

  if (slug === 'disaster-recovery') {
    state.equipment = state.equipment.map((item) =>
      item.name === 'Neuron Bridge 01' ? { ...item, status: 'degraded', latencyMs: Math.min(40, item.latencyMs + 7) } : item,
    )
    state.sites = state.sites.map((site) => (site.id === 103 ? { ...site, health: 'critical', ptpOffsetNs: 980 } : site))
    state.routes = state.routes.map((route) =>
      route.siteId === 103 || route.controller === 'EVS Neuron Gateway' ? { ...route, state: 'blocked' } : route,
    )
    state.workflows = state.workflows.map((workflow) =>
      workflow.name === 'Failover Contribution Path' ? { ...workflow, state: 'running', lastRun: nowClock() } : workflow,
    )
    state.alerts = [
      {
        id: Date.now(),
        title: 'Disaster recovery scenario activated',
        detail: 'Primary and backup path orchestration have entered recovery posture.',
        severity: 'critical' as const,
        acknowledged: false,
      },
      ...state.alerts.map((alert) => ({ ...alert, acknowledged: false })),
    ].slice(0, 8)
  } else if (slug === 'breaking-news') {
    state.runbooks = state.runbooks.map((runbook) =>
      runbook.name === 'Cloud Gallery Spin-up' ? { ...runbook, state: 'running' } : runbook,
    )
    state.workflows = state.workflows.map((workflow) =>
      workflow.name === 'Show Start Macro' ? { ...workflow, state: 'running', lastRun: nowClock() } : workflow,
    )
    state.gpioPorts = state.gpioPorts.map((port) => (port.port === 'GPO-01' ? { ...port, state: 1 } : port))
  } else if (slug === 'champions-league') {
    state.equipment = state.equipment.map((item) =>
      item.role === 'Multiviewer' || item.role === 'Cloud Production Pod' ? { ...item, cpuLoad: Math.min(96, item.cpuLoad + 8) } : item,
    )
    state.sites = state.sites.map((site) => (site.id === 101 || site.id === 102 ? { ...site, activeServices: site.activeServices + 2 } : site))
    state.runbooks = state.runbooks.map((runbook) =>
      runbook.name === 'Cloud Gallery Spin-up' ? { ...runbook, state: 'complete' } : runbook,
    )
    state.workflows = state.workflows.map((workflow) =>
      workflow.name === 'Provision Remote Gallery' ? { ...workflow, state: 'complete', lastRun: nowClock() } : workflow,
    )
  }

  addEvent(state, 'Scenario activated', `Scenario ${slug} moved into active mode.`)
  await writeState(state)
}

export async function runDiscovery() {
  const state = await readState()
  const existing = state.equipment.some((item) => item.name === 'Imagine SNP Gateway')

  if (!existing) {
    state.equipment.unshift({
      id: Date.now(),
      name: 'Imagine SNP Gateway',
      vendor: 'Imagine',
      model: 'SNP',
      role: 'Edge Gateway',
      facility: 'Cape Town Production',
      status: 'online',
      protocols: ['SMPTE 2022-7', 'NMOS IS-04'],
      cpuLoad: 34,
      temperature: 39,
      latencyMs: 5,
      lastSeen: nowIso(),
    })
    state.nmosNodes.unshift({
      id: Date.now() + 1,
      label: 'Imagine SNP Sender',
      nodeId: 'node-imagine-snp',
      kind: 'sender',
      transport: 'urn:x-nmos:transport:rtp',
      subscription: 'Backup / Fabric',
      status: 'registered',
    })
    state.connectors.unshift({
      id: Date.now() + 2,
      siteId: 102,
      name: 'Imagine SNP Connector',
      type: 'Router',
      vendor: 'Imagine',
      status: 'connected',
      protocol: 'SNP + NMOS',
      lastSync: nowIso(),
    })
    state.routes.unshift({
      id: Date.now() + 3,
      source: 'Imagine Backup Feed',
      destination: 'Program Bus B',
      siteId: 102,
      controller: 'Imagine SNP Connector',
      transport: 'ST 2022-7',
      state: 'standby',
      protected: true,
    })
  }

  addEvent(state, 'Discovery completed', 'Equipment discovery scanned NMOS, router, audio, and legacy control inventory.')
  await writeState(state)
}

export async function toggleGpio(portId: number) {
  const state = await readState()
  state.gpioPorts = state.gpioPorts.map((port) => (port.id === portId ? { ...port, state: port.state === 1 ? 0 : 1 } : port))
  const port = state.gpioPorts.find((item) => item.id === portId)
  if (port) {
    addEvent(state, 'GPIO state changed', `${port.port} (${port.label}) switched to ${port.state}.`)
  }
  await writeState(state)
}

export async function acknowledgeAlert(alertId: number) {
  const state = await readState()
  state.alerts = state.alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
  const alert = state.alerts.find((item) => item.id === alertId)
  if (alert) {
    addEvent(state, 'Alert acknowledged', alert.title)
  }
  await writeState(state)
}

export async function setConnectorStatus(connectorId: number, status: ConnectorRecord['status']) {
  const state = await readState()
  state.connectors = state.connectors.map((connector) =>
    connector.id === connectorId ? { ...connector, status, lastSync: nowIso() } : connector,
  )
  const connector = state.connectors.find((item) => item.id === connectorId)
  if (connector) {
    addEvent(state, 'Connector state changed', `${connector.name} set to ${status}.`)
  }
  await writeState(state)
}

export async function switchRoute(routeId: number) {
  const state = await readState()
  state.routes = state.routes.map((route) =>
    route.id === routeId
      ? { ...route, state: route.state === 'active' ? 'standby' : 'active' }
      : route.destination === state.routes.find((candidate) => candidate.id === routeId)?.destination
        ? { ...route, state: route.id === routeId ? route.state : 'standby' }
        : route,
  )
  const route = state.routes.find((item) => item.id === routeId)
  if (route) {
    addEvent(state, 'Route switched', `${route.source} to ${route.destination} via ${route.controller} set ${route.state === 'active' ? 'standby' : 'active'}.`)
  }
  await writeState(state)
}

export async function runWorkflow(workflowId: number) {
  const state = await readState()
  state.workflows = state.workflows.map((workflow) =>
    workflow.id === workflowId ? { ...workflow, state: 'running', lastRun: nowClock() } : workflow,
  )
  const workflow = state.workflows.find((item) => item.id === workflowId)
  if (workflow) {
    addEvent(state, 'Workflow launched', `${workflow.name} started against ${workflow.target}.`)
  }
  await writeState(state)
}

export async function queueConnectorJob(connectorId: number, action: AdapterAction, payload: Record<string, unknown>) {
  const state = await readState()
  const connector = state.connectors.find((item) => item.id === connectorId)

  if (!connector) {
    throw new Error('Connector not found.')
  }

  const jobId = Date.now()
  state.jobs.unshift({
    id: jobId,
    connectorId: connector.id,
    connectorName: connector.name,
    action,
    payload,
    state: 'running',
    createdAt: nowIso(),
  })
  addEvent(state, 'Job queued', `${action} queued for ${connector.name}.`)
  await writeState(state)

  const result = await executeConnectorAction(connector, action, payload)
  const nextState = await readState()
  nextState.jobs = nextState.jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          state: result.ok ? 'complete' : 'failed',
          result: result.message,
          completedAt: nowIso(),
        }
      : job,
  )

  addEvent(nextState, result.ok ? 'Job completed' : 'Job failed', result.message)
  await writeState(nextState)

  return nextState.jobs.find((job) => job.id === jobId)
}
