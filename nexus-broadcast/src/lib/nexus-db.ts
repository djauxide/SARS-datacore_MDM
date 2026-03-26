import fs from 'node:fs'
import path from 'node:path'
import type {
  AlertRecord,
  EquipmentRecord,
  EventRecord,
  GpioRecord,
  NmosNodeRecord,
  PlatformSnapshot,
  RunbookRecord,
  ScenarioRecord,
} from './types'

type PersistedState = {
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
}

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'platform-db.json')

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
  return {
    equipment: [
      { id: 1, name: 'JHB Core Router', vendor: 'Nexus', model: 'NXR-128', role: 'Video Router', facility: 'Johannesburg', status: 'online', protocols: ['ST 2110', 'NMOS IS-05', 'GPIO'], cpuLoad: 39, temperature: 46, latencyMs: 2, lastSeen: nowIso() },
      { id: 2, name: 'Cape Town Multiview', vendor: 'Nexus', model: 'MV-16', role: 'Multiviewer', facility: 'Cape Town', status: 'online', protocols: ['ST 2110', 'WebRTC'], cpuLoad: 54, temperature: 51, latencyMs: 7, lastSeen: nowIso() },
      { id: 3, name: 'Neuron Bridge 01', vendor: 'EVS', model: 'Neuron', role: 'Gateway', facility: 'Nairobi', status: 'degraded', protocols: ['ST 2022-7', 'SRT', 'NMOS IS-04'], cpuLoad: 71, temperature: 63, latencyMs: 16, lastSeen: nowIso() },
      { id: 4, name: 'Legacy GPIO Rack', vendor: 'Grass Valley', model: 'Encore GPIO', role: 'Legacy Interface', facility: 'Johannesburg', status: 'online', protocols: ['GPI', 'GPO', 'RS-422'], cpuLoad: 18, temperature: 33, latencyMs: 3, lastSeen: nowIso() },
      { id: 5, name: 'AMPP Burst Pod', vendor: 'GV', model: 'AMPP Edge', role: 'Cloud Production Pod', facility: 'AWS eu-west-2', status: 'online', protocols: ['ST 2110-22', 'NMOS IS-04', 'HTTPS'], cpuLoad: 58, temperature: 42, latencyMs: 23, lastSeen: nowIso() },
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
      { id: 1, time: nowClock(), title: 'Product datastore initialized', detail: 'Nexus seeded equipment, discovery, GPIO, and scenario state.' },
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

function readState() {
  ensureDataFile()
  return JSON.parse(fs.readFileSync(dbPath, 'utf8')) as PersistedState
}

function writeState(state: PersistedState) {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2))
}

function addEvent(state: PersistedState, title: string, detail: string) {
  state.events = [{ id: Date.now(), time: nowClock(), title, detail }, ...state.events].slice(0, 12)
}

function refreshTelemetry(state: PersistedState) {
  state.equipment = state.equipment.map((item, index) => {
    const cpuLoad = Math.max(12, Math.min(93, item.cpuLoad + (index % 2 === 0 ? 2 : -2)))
    const temperature = Math.max(28, Math.min(70, item.temperature + (index % 3) - 1))
    const latencyMs = Math.max(2, Math.min(32, item.latencyMs + (index % 2 === 0 ? 1 : -1)))
    const status = latencyMs > 18 || cpuLoad > 80 ? 'degraded' : item.status === 'offline' ? 'offline' : 'online'

    return {
      ...item,
      cpuLoad,
      temperature,
      latencyMs,
      status,
      lastSeen: nowIso(),
    }
  })
}

export function getPlatformSnapshot(): PlatformSnapshot {
  const state = readState()
  refreshTelemetry(state)
  writeState(state)

  return {
    generatedAt: nowIso(),
    facilities: Array.from(new Set(state.equipment.map((item) => item.facility))),
    metrics: {
      onAirServices: state.equipment.filter((item) => item.status === 'online').length,
      activeIncidents: state.alerts.filter((item) => !item.acknowledged && item.severity !== 'info').length,
      registeredNmosNodes: state.nmosNodes.filter((item) => item.status === 'registered').length,
      protectedFlows: state.scenarios.filter((item) => item.status === 'active').length,
      gpioActive: state.gpioPorts.filter((item) => item.state === 1).length,
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

export function triggerScenario(slug: string) {
  const state = readState()
  state.scenarios = state.scenarios.map((scenario) => ({
    ...scenario,
    status: scenario.slug === slug ? 'active' : 'ready',
  }))

  if (slug === 'disaster-recovery') {
    state.equipment = state.equipment.map((item) =>
      item.name === 'Neuron Bridge 01' ? { ...item, status: 'degraded', latencyMs: Math.min(40, item.latencyMs + 7) } : item,
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
    state.gpioPorts = state.gpioPorts.map((port) => (port.port === 'GPO-01' ? { ...port, state: 1 } : port))
  } else if (slug === 'champions-league') {
    state.equipment = state.equipment.map((item) =>
      item.role === 'Multiviewer' || item.role === 'Cloud Production Pod' ? { ...item, cpuLoad: Math.min(96, item.cpuLoad + 8) } : item,
    )
    state.runbooks = state.runbooks.map((runbook) =>
      runbook.name === 'Cloud Gallery Spin-up' ? { ...runbook, state: 'complete' } : runbook,
    )
  }

  addEvent(state, 'Scenario activated', `Scenario ${slug} moved into active mode.`)
  writeState(state)
}

export function runDiscovery() {
  const state = readState()
  const existing = state.equipment.some((item) => item.name === 'Lawo Audio Core')

  if (!existing) {
    state.equipment.unshift({
      id: Date.now(),
      name: 'Lawo Audio Core',
      vendor: 'Lawo',
      model: 'mc2',
      role: 'Audio Engine',
      facility: 'Johannesburg',
      status: 'online',
      protocols: ['AES67', 'NMOS IS-04', 'Ember+'],
      cpuLoad: 36,
      temperature: 40,
      latencyMs: 4,
      lastSeen: nowIso(),
    })

    state.nmosNodes.unshift({
      id: Date.now() + 1,
      label: 'Lawo Audio Engine Receiver',
      nodeId: 'node-lawo-audio',
      kind: 'receiver',
      transport: 'urn:x-nmos:transport:rtp',
      subscription: 'Commentary / Audio Core',
      status: 'registered',
    })
  }

  addEvent(state, 'Discovery completed', 'Equipment discovery scanned NMOS-capable and legacy inventory.')
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
