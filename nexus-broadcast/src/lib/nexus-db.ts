import type {
  AlertRecord,
  ConnectorRecord,
  ColorEngineRecord,
  EquipmentRecord,
  EventRecord,
  GpioRecord,
  JobRecord,
  McrChainRecord,
  NmosFlowRecord,
  NmosNodeRecord,
  ObUnitRecord,
  PlatformSnapshot,
  ProductionSetupRecord,
  ReceiverRecord,
  RouteRecord,
  RunbookRecord,
  SdiBridgeRecord,
  ScenarioRecord,
  SenderRecord,
  SiteRecord,
  TenantRecord,
  UserRecord,
  VirtualStudioRecord,
  WorkflowRecord,
  AudioMonitorRecord,
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
  senders: SenderRecord[]
  receivers: ReceiverRecord[]
  obUnits: ObUnitRecord[]
  virtualStudios: VirtualStudioRecord[]
  mcrChains: McrChainRecord[]
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  nmosFlows: NmosFlowRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
  productions: ProductionSetupRecord[]
  activeProductionId?: number
  colorEngines: ColorEngineRecord[]
  audioMonitors: AudioMonitorRecord[]
  sdiBridges: SdiBridgeRecord[]
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

function rewriteBranding(value: string) {
  return value
    .replaceAll('Grass Valley', 'Nexus')
    .replaceAll('GV Router Bridge', 'Nexus Router Bridge')
    .replaceAll('GV Native + GPIO', 'Nexus Control + GPIO')
    .replaceAll('GV', 'Nexus')
    .replaceAll('EVS Neuron Gateway', 'Nexus Gateway Engine')
    .replaceAll('EVS', 'Nexus')
    .replaceAll('Neuron Bridge 01', 'Nexus Gateway 01')
    .replaceAll('Neuron Gateway A', 'Nexus Gateway A')
    .replaceAll('Neuron', 'Nexus Gateway')
    .replaceAll('AMPP Burst Pod', 'Nexus Burst Pod')
    .replaceAll('AMPP Edge', 'Nexus Edge')
    .replaceAll('AMPP Playout', 'Nexus Cloud Playout')
    .replaceAll('Cerebrum', 'Nexus Orchestrate')
    .replaceAll('NEP', 'Nexus')
}

function normalizeBranding(state: PersistedState) {
  state.connectors = state.connectors.map((connector) => ({
    ...connector,
    name: rewriteBranding(connector.name),
    vendor: rewriteBranding(connector.vendor),
    protocol: rewriteBranding(connector.protocol),
  }))

  state.routes = state.routes.map((route) => ({
    ...route,
    controller: rewriteBranding(route.controller),
  }))

  state.workflows = state.workflows.map((workflow) => ({
    ...workflow,
    target: rewriteBranding(workflow.target),
  }))

  state.equipment = state.equipment.map((item) => ({
    ...item,
    name: rewriteBranding(item.name),
    vendor: rewriteBranding(item.vendor),
    model: rewriteBranding(item.model),
    protocols: item.protocols.map((protocol) => rewriteBranding(protocol)),
  }))

  state.mcrChains = state.mcrChains.map((chain) => ({
    ...chain,
    playout: rewriteBranding(chain.playout),
    ingest: rewriteBranding(chain.ingest),
    compliance: rewriteBranding(chain.compliance),
    distribution: rewriteBranding(chain.distribution),
  }))

  state.events = state.events.map((event) => ({
    ...event,
    detail: rewriteBranding(event.detail),
  }))
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
      { id: 2, siteId: 101, name: 'Nexus Router Bridge', type: 'Router', vendor: 'Nexus', status: 'connected', protocol: 'Nexus Control + GPIO', lastSync: seen },
      { id: 3, siteId: 103, name: 'Nexus Gateway Engine', type: 'Replay', vendor: 'Nexus', status: 'degraded', protocol: 'Nexus Gateway + NMOS', lastSync: seen },
      { id: 4, siteId: 102, name: 'Lawo Audio Core', type: 'Audio', vendor: 'Lawo', status: 'connected', protocol: 'AES67 + Ember+', lastSync: seen },
      { id: 5, siteId: 101, name: 'Cloud Burst Control', type: 'Cloud', vendor: 'Nexus', status: 'connected', protocol: 'HTTPS + WebSocket', lastSync: seen },
      { id: 6, siteId: 101, name: 'Legacy GPIO Rack', type: 'GPIO', vendor: 'Nexus', status: 'connected', protocol: 'GPI/GPO', lastSync: seen },
      { id: 7, siteId: 101, name: 'Legacy SDI Bridge', type: 'Bridge', vendor: 'Nexus', status: 'connected', protocol: '12G-SDI / ST 2110', lastSync: seen },
      { id: 8, siteId: 101, name: 'Scope and Loudness Core', type: 'Monitoring', vendor: 'Nexus', status: 'connected', protocol: 'Waveform / Vectorscope / LUFS', lastSync: seen },
    ],
    routes: [
      { id: 1, source: 'Studio 1 Program', destination: 'Cloud Switcher A', siteId: 101, controller: 'Nexus Router Bridge', transport: 'ST 2110-20', state: 'active', protected: true },
      { id: 2, source: 'Replay A', destination: 'Program Bus B', siteId: 101, controller: 'Nexus Gateway Engine', transport: 'ST 2110-22', state: 'standby', protected: true },
      { id: 3, source: 'Commentary A', destination: 'Audio Core', siteId: 102, controller: 'Lawo Audio Core', transport: 'AES67', state: 'active', protected: false },
      { id: 4, source: 'Breaking News Feed', destination: 'FAST Output', siteId: 103, controller: 'Cloud Burst Control', transport: 'SRT', state: 'blocked', protected: true },
    ],
    workflows: [
      { id: 1, name: 'Provision Remote Gallery', category: 'provisioning', target: 'Cloud Burst Control', state: 'idle', lastRun: 'Today 10:14' },
      { id: 2, name: 'Failover Contribution Path', category: 'failover', target: 'Nexus Gateway Engine', state: 'idle', lastRun: 'Today 09:22' },
      { id: 3, name: 'Validate NMOS Connections', category: 'compliance', target: 'NMOS Registry Core', state: 'complete', lastRun: 'Today 11:06' },
      { id: 4, name: 'Show Start Macro', category: 'show-control', target: 'Nexus Router Bridge', state: 'idle', lastRun: 'Yesterday 18:32' },
    ],
    equipment: [
      { id: 1, name: 'JHB Core Router', vendor: 'Nexus', model: 'NXR-128', role: 'Video Router', facility: 'Johannesburg HQ', status: 'online', protocols: ['ST 2110', 'NMOS IS-05', 'GPIO'], cpuLoad: 39, temperature: 46, latencyMs: 2, lastSeen: seen },
      { id: 2, name: 'Cape Town Multiview', vendor: 'Nexus', model: 'MV-16', role: 'Multiviewer', facility: 'Cape Town Production', status: 'online', protocols: ['ST 2110', 'WebRTC'], cpuLoad: 54, temperature: 51, latencyMs: 7, lastSeen: seen },
      { id: 3, name: 'Nexus Gateway 01', vendor: 'Nexus', model: 'Nexus Gateway', role: 'Gateway', facility: 'Nairobi Edge', status: 'degraded', protocols: ['ST 2022-7', 'SRT', 'NMOS IS-04'], cpuLoad: 71, temperature: 63, latencyMs: 16, lastSeen: seen },
      { id: 4, name: 'Legacy GPIO Rack', vendor: 'Nexus', model: 'Nexus GPIO', role: 'Legacy Interface', facility: 'Johannesburg HQ', status: 'online', protocols: ['GPI', 'GPO', 'RS-422'], cpuLoad: 18, temperature: 33, latencyMs: 3, lastSeen: seen },
      { id: 5, name: 'Nexus Burst Pod', vendor: 'Nexus', model: 'Nexus Edge', role: 'Cloud Production Pod', facility: 'AWS eu-west-2', status: 'online', protocols: ['ST 2110-22', 'NMOS IS-04', 'HTTPS'], cpuLoad: 58, temperature: 42, latencyMs: 23, lastSeen: seen },
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
    senders: [
      { id: 1, label: 'Studio 1 Program Sender', flowId: 1, transport: 'urn:x-nmos:transport:rtp', deviceId: 1, manifestHref: '/manifests/studio-1.sdp', active: true },
      { id: 2, label: 'Replay A Sender', flowId: 4, transport: 'urn:x-nmos:transport:websocket', deviceId: 3, manifestHref: '/manifests/replay-a.json', active: false },
      { id: 3, label: 'Commentary A Sender', flowId: 2, transport: 'urn:x-nmos:transport:rtp', deviceId: 4, manifestHref: '/manifests/commentary-a.sdp', active: true },
    ],
    receivers: [
      { id: 1, label: 'Cloud Switcher A Receiver', format: 'video', transport: 'urn:x-nmos:transport:rtp', deviceId: 5, activeSenderId: 1, stagedSenderId: 1, activationMode: 'immediate' },
      { id: 2, label: 'Program Bus B Receiver', format: 'video', transport: 'urn:x-nmos:transport:websocket', deviceId: 2, activeSenderId: 2, stagedSenderId: 2, activationMode: 'immediate' },
      { id: 3, label: 'Audio Core Receiver', format: 'audio', transport: 'urn:x-nmos:transport:rtp', deviceId: 4, activeSenderId: 3, stagedSenderId: 3, activationMode: 'immediate' },
    ],
    obUnits: [
      { id: 1, name: 'OB Unit Alpha', venue: 'FNB Stadium', contribution: 'fiber', latencyMs: 34, status: 'on-air', activeStudioId: 1 },
      { id: 2, name: 'Flypack Beta', venue: 'Cape Town Arena', contribution: 'bonded-cellular', latencyMs: 86, status: 'ready', activeStudioId: 2 },
      { id: 3, name: 'Field Hub Nairobi', venue: 'City Hall', contribution: 'satellite', latencyMs: 142, status: 'degraded' },
    ],
    virtualStudios: [
      { id: 1, name: 'VS Cloud One', siteId: 101, host: 'hybrid', mode: 'live', operatorCount: 6, mcrChainId: 1 },
      { id: 2, name: 'VS Remote Two', siteId: 102, host: 'cloud', mode: 'standby', operatorCount: 4, mcrChainId: 2 },
      { id: 3, name: 'Studio Backup Pod', siteId: 103, host: 'on-prem', mode: 'maintenance', operatorCount: 2, mcrChainId: 3 },
    ],
    mcrChains: [
      { id: 1, name: 'Primary Cloud MCR', playout: 'Nexus Cloud Playout', ingest: 'Nexus Gateway A', compliance: 'Loudness + SCTE', distribution: 'OTT + Satellite', status: 'on-air', activeStudioId: 1 },
      { id: 2, name: 'Remote Event MCR', playout: 'Nexus Channel Engine', ingest: 'SRT Edge Ingest', compliance: 'Delay + QC', distribution: 'Digital + Social', status: 'ready', activeStudioId: 2 },
      { id: 3, name: 'Backup MCR', playout: 'Disaster Playout', ingest: 'Backup Fiber Ingest', compliance: 'Safe Output', distribution: 'Disaster Recovery', status: 'switching' },
    ],
    colorEngines: [
      { id: 1, camera: 'Camera 1', shader: 'Vision 1', paintProfile: 'Match Day Neutral', iris: 'F4.0', whiteBalanceK: 5600, gainDb: 3, status: 'aligned' },
      { id: 2, camera: 'Camera 2', shader: 'Vision 2', paintProfile: 'Studio Cool', iris: 'F2.8', whiteBalanceK: 5200, gainDb: 1, status: 'adjusting' },
      { id: 3, camera: 'Camera 3', shader: 'Remote Shade', paintProfile: 'Concert Saturated', iris: 'F5.6', whiteBalanceK: 4300, gainDb: 5, status: 'warning' },
    ],
    audioMonitors: [
      { id: 1, zone: 'Program', source: 'Main mix', loudnessLufs: -23.1, peakDbfs: -8.7, phase: 'in-phase', confidence: 'stable' },
      { id: 2, zone: 'Commentary', source: 'Commentary A', loudnessLufs: -19.8, peakDbfs: -6.1, phase: 'watch', confidence: 'warning' },
      { id: 3, zone: 'MCR QC', source: 'Distribution confidence', loudnessLufs: -22.7, peakDbfs: -9.3, phase: 'in-phase', confidence: 'stable' },
    ],
    sdiBridges: [
      { id: 1, name: 'Bridge JHB-01', siteId: 101, mode: 'SDI-IP', ioCount: '32x32', reference: 'PTP', status: 'online' },
      { id: 2, name: 'Bridge CPT-Edge', siteId: 102, mode: 'hybrid', ioCount: '16x16', reference: 'Tri-level', status: 'online' },
      { id: 3, name: 'Bridge Legacy MCR', siteId: 103, mode: 'IP-SDI', ioCount: '8x8', reference: 'Black Burst', status: 'degraded' },
    ],
    productions: [
      {
        id: 1,
        name: 'Premier Football Match',
        productionType: 'sports',
        status: 'live',
        siteId: 101,
        studioId: 1,
        mcrChainId: 1,
        multiviewLayout: '4x2 match gallery',
        cameraCount: 12,
        audioProfile: '5.1 international with commentary',
        graphicsProfile: 'Sports lower thirds and scorebug',
        redundancy: 'protected',
        primaryRouteIds: [1, 2],
        connectorIds: [1, 2, 4, 5, 6, 7, 8],
        notes: 'Main OB match workflow with cloud backup gallery.',
      },
      {
        id: 2,
        name: 'Rolling News Bulletin',
        productionType: 'news',
        status: 'ready',
        siteId: 102,
        studioId: 2,
        mcrChainId: 2,
        multiviewLayout: '3x3 newsroom',
        cameraCount: 5,
        audioProfile: 'Stereo anchor and remote guest',
        graphicsProfile: 'Breaking and lower-third package',
        redundancy: 'protected',
        primaryRouteIds: [3, 4],
        connectorIds: [1, 4, 5, 6, 7, 8],
        notes: 'Fast switching between studio, remote guest, and branded outputs.',
      },
      {
        id: 3,
        name: 'Remote Flypack Concert',
        productionType: 'entertainment',
        status: 'draft',
        siteId: 103,
        studioId: 3,
        mcrChainId: 3,
        multiviewLayout: 'wide stage mosaic',
        cameraCount: 8,
        audioProfile: 'Music mix plus stems',
        graphicsProfile: 'Event branding and sponsor loop',
        redundancy: 'dual-site',
        primaryRouteIds: [2, 4],
        connectorIds: [1, 3, 5, 6, 7, 8],
        notes: 'Draft remote entertainment build with dual-site recovery.',
      },
    ],
    activeProductionId: 1,
    events: [
      { id: 1, time: nowClock(), title: 'Enterprise datastore initialized', detail: 'Nexus seeded tenants, sites, connectors, discovery, and operational state.' },
      { id: 2, time: nowClock(), title: 'NMOS registry linked', detail: 'Initial simulated device registration completed.' },
    ],
  }
}

function normalizeState(raw: Partial<PersistedState>): PersistedState {
  const seeded = seedState()
  const state = {
    tenants: raw.tenants ?? seeded.tenants,
    sites: raw.sites ?? seeded.sites,
    users: raw.users ?? seeded.users,
    connectors: raw.connectors ?? seeded.connectors,
    routes: raw.routes ?? seeded.routes,
    workflows: raw.workflows ?? seeded.workflows,
    jobs: raw.jobs ?? seeded.jobs,
    senders: raw.senders ?? seeded.senders,
    receivers: raw.receivers ?? seeded.receivers,
    obUnits: raw.obUnits ?? seeded.obUnits,
    virtualStudios: raw.virtualStudios ?? seeded.virtualStudios,
    mcrChains: raw.mcrChains ?? seeded.mcrChains,
    equipment: raw.equipment ?? seeded.equipment,
    nmosNodes: raw.nmosNodes ?? seeded.nmosNodes,
    nmosFlows: raw.nmosFlows ?? seeded.nmosFlows,
    gpioPorts: raw.gpioPorts ?? seeded.gpioPorts,
    alerts: raw.alerts ?? seeded.alerts,
    scenarios: raw.scenarios ?? seeded.scenarios,
    runbooks: raw.runbooks ?? seeded.runbooks,
    events: raw.events ?? seeded.events,
    productions: raw.productions ?? seeded.productions,
    activeProductionId: raw.activeProductionId ?? seeded.activeProductionId,
    colorEngines: raw.colorEngines ?? seeded.colorEngines,
    audioMonitors: raw.audioMonitors ?? seeded.audioMonitors,
    sdiBridges: raw.sdiBridges ?? seeded.sdiBridges,
  }

  normalizeBranding(state)
  return state
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
    const status = connector.name === 'Nexus Gateway Engine' && index % 2 === 0 ? 'degraded' : connector.status === 'offline' ? 'offline' : 'connected'
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

  state.virtualStudios = state.virtualStudios.map((studio, index) => ({
    ...studio,
    operatorCount: Math.max(1, studio.operatorCount + ((index % 2 === 0) ? 1 : -1)),
  }))

  state.colorEngines = state.colorEngines.map((engine, index) => ({
    ...engine,
    gainDb: Math.max(0, Math.min(12, engine.gainDb + (index % 2 === 0 ? 1 : -1))),
    status: engine.gainDb > 4 ? 'warning' : index % 2 === 0 ? 'aligned' : engine.status,
  }))

  state.audioMonitors = state.audioMonitors.map((monitor, index) => {
    const loudnessLufs = Number((monitor.loudnessLufs + (index % 2 === 0 ? 0.1 : -0.1)).toFixed(1))
    const peakDbfs = Number((monitor.peakDbfs + (index % 2 === 0 ? -0.2 : 0.2)).toFixed(1))
    const confidence = loudnessLufs > -20.0 || peakDbfs > -6.0 ? 'warning' : 'stable'
    return { ...monitor, loudnessLufs, peakDbfs, confidence }
  })
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
    jobs: state.jobs,
    senders: state.senders,
    receivers: state.receivers,
    obUnits: state.obUnits,
    virtualStudios: state.virtualStudios,
    mcrChains: state.mcrChains,
    metrics: {
      onAirServices: state.equipment.filter((item) => item.status === 'online').length,
      activeIncidents: state.alerts.filter((item) => !item.acknowledged && item.severity !== 'info').length,
      registeredNmosNodes: state.nmosNodes.filter((item) => item.status === 'registered').length,
      protectedFlows: state.scenarios.filter((item) => item.status === 'active').length,
      gpioActive: state.gpioPorts.filter((item) => item.state === 1).length,
      connectedSites: state.sites.filter((item) => item.health !== 'critical').length,
      connectedConnectors: state.connectors.filter((item) => item.status === 'connected').length,
      queuedJobs: state.jobs.filter((item) => item.state === 'queued' || item.state === 'running').length,
      liveStudios: state.virtualStudios.filter((item) => item.mode === 'live').length,
    },
    equipment: state.equipment,
    nmosNodes: state.nmosNodes,
    nmosFlows: state.nmosFlows,
    gpioPorts: state.gpioPorts,
    alerts: state.alerts,
    scenarios: state.scenarios,
    runbooks: state.runbooks,
    events: state.events,
    productions: state.productions,
    activeProductionId: state.activeProductionId,
    colorEngines: state.colorEngines,
    audioMonitors: state.audioMonitors,
    sdiBridges: state.sdiBridges,
  }
}

export async function listProductionSetups() {
  const state = await readState()
  return {
    productions: state.productions,
    activeProductionId: state.activeProductionId,
  }
}

export async function applyProductionSetup(productionId: number) {
  const state = await readState()
  const production = state.productions.find((item) => item.id === productionId)

  if (!production) {
    throw new Error('Production setup not found.')
  }

  state.activeProductionId = productionId
  state.productions = state.productions.map((item) => ({
    ...item,
    status: item.id === productionId ? 'live' : item.status === 'live' ? 'ready' : item.status,
  }))
  state.virtualStudios = state.virtualStudios.map((studio) => ({
    ...studio,
    mode: studio.id === production.studioId ? 'live' : studio.mode === 'live' ? 'standby' : studio.mode,
  }))
  state.mcrChains = state.mcrChains.map((chain) => ({
    ...chain,
    status: chain.id === production.mcrChainId ? 'on-air' : chain.status === 'on-air' ? 'ready' : chain.status,
    activeStudioId: chain.id === production.mcrChainId ? production.studioId : chain.activeStudioId,
  }))
  state.routes = state.routes.map((route) => ({
    ...route,
    state: production.primaryRouteIds.includes(route.id) ? 'active' : route.state === 'active' ? 'standby' : route.state,
    protected: production.redundancy !== 'single' ? true : route.protected,
  }))
  state.connectors = state.connectors.map((connector) => ({
    ...connector,
    status: production.connectorIds.includes(connector.id) ? 'connected' : connector.status,
  }))
  state.sites = state.sites.map((site) => ({
    ...site,
    activeServices: site.id === production.siteId ? Math.max(site.activeServices, production.cameraCount + 4) : site.activeServices,
    mode: site.id === production.siteId ? 'Production' : site.mode,
  }))

  addEvent(state, 'Production setup applied', `${production.name} is now active with ${production.multiviewLayout}.`)
  await writeState(state)
  return production
}

export async function saveProductionSetup(
  input: Omit<ProductionSetupRecord, 'id'> & { id?: number },
) {
  const state = await readState()
  const nextId = input.id ?? Date.now()
  const nextRecord: ProductionSetupRecord = {
    ...input,
    id: nextId,
  }

  const exists = state.productions.some((item) => item.id === nextId)
  state.productions = exists
    ? state.productions.map((item) => (item.id === nextId ? nextRecord : item))
    : [nextRecord, ...state.productions]

  addEvent(state, exists ? 'Production setup updated' : 'Production setup created', `${nextRecord.name} saved to the configuration database.`)
  await writeState(state)
  return nextRecord
}

export async function getUsers() {
  return (await readState()).users
}

export async function triggerScenario(slug: string) {
  const state = await readState()
  state.scenarios = state.scenarios.map((scenario) => ({ ...scenario, status: scenario.slug === slug ? 'active' : 'ready' }))

  if (slug === 'disaster-recovery') {
    state.equipment = state.equipment.map((item) =>
      item.name === 'Nexus Gateway 01' ? { ...item, status: 'degraded', latencyMs: Math.min(40, item.latencyMs + 7) } : item,
    )
    state.sites = state.sites.map((site) => (site.id === 103 ? { ...site, health: 'critical', ptpOffsetNs: 980 } : site))
    state.routes = state.routes.map((route) =>
      route.siteId === 103 || route.controller === 'Nexus Gateway Engine' ? { ...route, state: 'blocked' } : route,
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
        name: 'Nexus SNP Connector',
        type: 'Router',
        vendor: 'Nexus',
        status: 'connected',
        protocol: 'SNP + NMOS',
        lastSync: nowIso(),
      })
    state.routes.unshift({
      id: Date.now() + 3,
      source: 'Imagine Backup Feed',
      destination: 'Program Bus B',
      siteId: 102,
        controller: 'Nexus SNP Connector',
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
  const selected = state.routes.find((candidate) => candidate.id === routeId)
  state.routes = state.routes.map((route) =>
    route.id === routeId
      ? { ...route, state: route.state === 'active' ? 'standby' : 'active' }
      : route.destination === selected?.destination
        ? { ...route, state: 'standby' }
        : route,
  )
  const route = state.routes.find((item) => item.id === routeId)
  if (route) {
    const sender = state.senders.find((item) => route.source.startsWith(item.label.split(' ')[0]))
    const receiver = state.receivers.find((item) => route.destination.startsWith(item.label.split(' ')[0]))
    if (sender && receiver) {
      state.receivers = state.receivers.map((item) =>
        item.id === receiver.id ? { ...item, stagedSenderId: sender.id, activeSenderId: sender.id, activationMode: 'immediate' } : item,
      )
    }
  }
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

export async function stageReceiverConnection(receiverId: number, senderId?: number) {
  const state = await readState()
  state.receivers = state.receivers.map((receiver) =>
    receiver.id === receiverId ? { ...receiver, stagedSenderId: senderId, activationMode: 'immediate' } : receiver,
  )
  const receiver = state.receivers.find((item) => item.id === receiverId)
  if (receiver) {
    addEvent(state, 'Receiver staged', `${receiver.label} staged to sender ${senderId ?? 'none'}.`)
  }
  await writeState(state)
}

export async function activateReceiverConnection(receiverId: number) {
  const state = await readState()
  state.receivers = state.receivers.map((receiver) =>
    receiver.id === receiverId ? { ...receiver, activeSenderId: receiver.stagedSenderId } : receiver,
  )
  const receiver = state.receivers.find((item) => item.id === receiverId)
  if (receiver) {
    addEvent(state, 'Receiver activated', `${receiver.label} activated sender ${receiver.activeSenderId ?? 'none'}.`)
  }
  await writeState(state)
}

export async function activateVirtualStudio(studioId: number) {
  const state = await readState()
  state.virtualStudios = state.virtualStudios.map((studio) => ({
    ...studio,
    mode: studio.id === studioId ? 'live' : studio.mode === 'live' ? 'standby' : studio.mode,
  }))
  const studio = state.virtualStudios.find((item) => item.id === studioId)
  state.mcrChains = state.mcrChains.map((chain) => ({
    ...chain,
    status: chain.id === studio?.mcrChainId ? 'on-air' : chain.status === 'on-air' ? 'ready' : chain.status,
    activeStudioId: chain.id === studio?.mcrChainId ? studioId : chain.activeStudioId,
  }))
  if (studio) {
    addEvent(state, 'Virtual studio activated', `${studio.name} moved to live with MCR chain ${studio.mcrChainId}.`)
  }
  await writeState(state)
}

export async function assignObUnit(obUnitId: number, studioId: number) {
  const state = await readState()
  state.obUnits = state.obUnits.map((unit) =>
    unit.id === obUnitId ? { ...unit, activeStudioId: studioId, status: 'on-air' } : unit,
  )
  const unit = state.obUnits.find((item) => item.id === obUnitId)
  if (unit) {
    addEvent(state, 'OB linked to studio', `${unit.name} assigned to virtual studio ${studioId}.`)
  }
  await writeState(state)
}
