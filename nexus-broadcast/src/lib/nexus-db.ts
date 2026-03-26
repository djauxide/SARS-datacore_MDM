import fs from 'node:fs'
import path from 'node:path'
import type {
  AlertRecord,
  ConnectorRecord,
  EquipmentRecord,
  EventRecord,
  GpioRecord,
  NmosNodeRecord,
  PlatformSnapshot,
  RunbookRecord,
  ScenarioRecord,
  SiteRecord,
  TenantRecord,
  UserRecord,
} from './types'

type PersistedState = {
  tenants: TenantRecord[]
  sites: SiteRecord[]
  users: UserRecord[]
  connectors: ConnectorRecord[]
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
}

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'platform-runtime.json')

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
    events: [
      { id: 1, time: nowClock(), title: 'Enterprise datastore initialized', detail: 'Nexus seeded tenants, sites, connectors, discovery, and operational state.' },
      { id: 2, time: nowClock(), title: 'NMOS registry linked', detail: 'Initial simulated device registration completed.' },
    ],
  }
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedState(), null, 2))
  }
}

function normalizeState(raw: Partial<PersistedState>): PersistedState {
  const seeded = seedState()

  return {
    tenants: raw.tenants ?? seeded.tenants,
    sites: raw.sites ?? seeded.sites,
    users: raw.users ?? seeded.users,
    connectors: raw.connectors ?? seeded.connectors,
    equipment: raw.equipment ?? seeded.equipment,
    nmosNodes: raw.nmosNodes ?? seeded.nmosNodes,
    gpioPorts: raw.gpioPorts ?? seeded.gpioPorts,
    alerts: raw.alerts ?? seeded.alerts,
    scenarios: raw.scenarios ?? seeded.scenarios,
    runbooks: raw.runbooks ?? seeded.runbooks,
    events: raw.events ?? seeded.events,
  }
}

function readState() {
  ensureDataFile()
  return normalizeState(JSON.parse(fs.readFileSync(dbPath, 'utf8')) as Partial<PersistedState>)
}

function writeState(state: PersistedState) {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2))
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
}

export function getPlatformSnapshot(): PlatformSnapshot {
  const state = readState()
  refreshTelemetry(state)
  writeState(state)

  return {
    generatedAt: nowIso(),
    facilities: Array.from(new Set(state.equipment.map((item) => item.facility))),
    tenants: state.tenants,
    sites: state.sites,
    users: state.users,
    connectors: state.connectors,
    metrics: {
      onAirServices: state.equipment.filter((item) => item.status === 'online').length,
      activeIncidents: state.alerts.filter((item) => !item.acknowledged && item.severity !== 'info').length,
      registeredNmosNodes: state.nmosNodes.filter((item) => item.status === 'registered').length,
      protectedFlows: state.scenarios.filter((item) => item.status === 'active').length,
      gpioActive: state.gpioPorts.filter((item) => item.state === 1).length,
      connectedSites: state.sites.filter((item) => item.health !== 'critical').length,
      connectedConnectors: state.connectors.filter((item) => item.status === 'connected').length,
    },
    equipment: state.equipment,
    nmosNodes: state.nmosNodes,
    gpioPorts: state.gpioPorts,
    alerts: state.alerts,
    scenarios: state.scenarios,
    runbooks: state.runbooks,
    events: state.events,
  }
}

export function getUsers() {
  return readState().users
}

export function triggerScenario(slug: string) {
  const state = readState()
  state.scenarios = state.scenarios.map((scenario) => ({ ...scenario, status: scenario.slug === slug ? 'active' : 'ready' }))

  if (slug === 'disaster-recovery') {
    state.equipment = state.equipment.map((item) =>
      item.name === 'Neuron Bridge 01' ? { ...item, status: 'degraded', latencyMs: Math.min(40, item.latencyMs + 7) } : item,
    )
    state.sites = state.sites.map((site) => (site.id === 103 ? { ...site, health: 'critical', ptpOffsetNs: 980 } : site))
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
    state.gpioPorts = state.gpioPorts.map((port) => (port.port === 'GPO-01' ? { ...port, state: 1 } : port))
  } else if (slug === 'champions-league') {
    state.equipment = state.equipment.map((item) =>
      item.role === 'Multiviewer' || item.role === 'Cloud Production Pod' ? { ...item, cpuLoad: Math.min(96, item.cpuLoad + 8) } : item,
    )
    state.sites = state.sites.map((site) => (site.id === 101 || site.id === 102 ? { ...site, activeServices: site.activeServices + 2 } : site))
    state.runbooks = state.runbooks.map((runbook) =>
      runbook.name === 'Cloud Gallery Spin-up' ? { ...runbook, state: 'complete' } : runbook,
    )
  }

  addEvent(state, 'Scenario activated', `Scenario ${slug} moved into active mode.`)
  writeState(state)
}

export function runDiscovery() {
  const state = readState()
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
  }

  addEvent(state, 'Discovery completed', 'Equipment discovery scanned NMOS, router, audio, and legacy control inventory.')
  writeState(state)
}

export function toggleGpio(portId: number) {
  const state = readState()
  state.gpioPorts = state.gpioPorts.map((port) => (port.id === portId ? { ...port, state: port.state === 1 ? 0 : 1 } : port))
  const port = state.gpioPorts.find((item) => item.id === portId)
  if (port) {
    addEvent(state, 'GPIO state changed', `${port.port} (${port.label}) switched to ${port.state}.`)
  }
  writeState(state)
}

export function acknowledgeAlert(alertId: number) {
  const state = readState()
  state.alerts = state.alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
  const alert = state.alerts.find((item) => item.id === alertId)
  if (alert) {
    addEvent(state, 'Alert acknowledged', alert.title)
  }
  writeState(state)
}

export function setConnectorStatus(connectorId: number, status: ConnectorRecord['status']) {
  const state = readState()
  state.connectors = state.connectors.map((connector) =>
    connector.id === connectorId ? { ...connector, status, lastSync: nowIso() } : connector,
  )
  const connector = state.connectors.find((item) => item.id === connectorId)
  if (connector) {
    addEvent(state, 'Connector state changed', `${connector.name} set to ${status}.`)
  }
  writeState(state)
}
