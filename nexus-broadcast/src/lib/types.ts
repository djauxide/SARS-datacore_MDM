export type EquipmentRecord = {
  id: number
  name: string
  vendor: string
  model: string
  role: string
  facility: string
  status: 'online' | 'degraded' | 'offline'
  protocols: string[]
  cpuLoad: number
  temperature: number
  latencyMs: number
  lastSeen: string
}

export type UserRole = 'operator' | 'engineer' | 'trainee' | 'admin'

export type UserRecord = {
  id: number
  name: string
  email: string
  role: UserRole
  tenantId: number
  siteId: number
}

export type TenantRecord = {
  id: number
  name: string
  region: string
  tier: 'Enterprise' | 'Broadcast Group' | 'Training'
}

export type SiteRecord = {
  id: number
  tenantId: number
  name: string
  location: string
  mode: 'Production' | 'Backup' | 'Training'
  health: 'healthy' | 'watch' | 'critical'
  activeServices: number
  ptpOffsetNs: number
}

export type NmosNodeRecord = {
  id: number
  label: string
  nodeId: string
  kind: 'sender' | 'receiver' | 'node'
  transport: string
  subscription: string
  status: 'registered' | 'warning' | 'missing'
}

export type NmosFlowRecord = {
  id: number
  nodeId: string
  label: string
  mediaType: 'video' | 'audio' | 'anc'
  format: string
  status: 'active' | 'standby' | 'warning'
}

export type ConnectorRecord = {
  id: number
  siteId: number
  name: string
  type: 'NMOS' | 'GPIO' | 'Router' | 'Replay' | 'Cloud' | 'Audio' | 'Bridge' | 'Monitoring'
  vendor: string
  status: 'connected' | 'degraded' | 'offline'
  protocol: string
  lastSync: string
  endpoint?: string
  capabilities?: string[]
}

export type RouteRecord = {
  id: number
  source: string
  destination: string
  siteId: number
  controller: string
  transport: string
  state: 'active' | 'standby' | 'blocked'
  protected: boolean
}

export type WorkflowRecord = {
  id: number
  name: string
  category: 'failover' | 'provisioning' | 'compliance' | 'show-control'
  target: string
  state: 'idle' | 'running' | 'complete'
  lastRun: string
}

export type JobRecord = {
  id: number
  connectorId: number
  connectorName: string
  action: string
  payload: Record<string, unknown>
  state: 'queued' | 'running' | 'complete' | 'failed'
  result?: string
  createdAt: string
  completedAt?: string
}

export type SenderRecord = {
  id: number
  label: string
  flowId: number
  transport: string
  deviceId: number
  manifestHref: string
  active: boolean
}

export type ReceiverRecord = {
  id: number
  label: string
  format: string
  transport: string
  deviceId: number
  activeSenderId?: number
  stagedSenderId?: number
  activationMode: 'immediate' | 'scheduled'
}

export type ObUnitRecord = {
  id: number
  name: string
  venue: string
  contribution: 'fiber' | 'satellite' | 'bonded-cellular'
  latencyMs: number
  status: 'ready' | 'on-air' | 'degraded'
  activeStudioId?: number
}

export type VirtualStudioRecord = {
  id: number
  name: string
  siteId: number
  host: 'cloud' | 'on-prem' | 'hybrid'
  mode: 'standby' | 'live' | 'maintenance'
  operatorCount: number
  mcrChainId: number
}

export type McrChainRecord = {
  id: number
  name: string
  playout: string
  ingest: string
  compliance: string
  distribution: string
  status: 'ready' | 'switching' | 'on-air'
  activeStudioId?: number
}

export type GpioRecord = {
  id: number
  port: string
  label: string
  direction: 'GPI' | 'GPO'
  state: 0 | 1
  deviceName: string
}

export type AlertRecord = {
  id: number
  title: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
  acknowledged: boolean
}

export type ScenarioRecord = {
  id: number
  slug: string
  name: string
  description: string
  status: 'ready' | 'active'
}

export type RunbookRecord = {
  id: number
  name: string
  purpose: string
  eta: string
  state: 'idle' | 'running' | 'complete'
}

export type EventRecord = {
  id: number
  time: string
  title: string
  detail: string
}

export type ColorEngineRecord = {
  id: number
  camera: string
  shader: string
  paintProfile: string
  iris: string
  whiteBalanceK: number
  gainDb: number
  status: 'aligned' | 'adjusting' | 'warning'
}

export type AudioMonitorRecord = {
  id: number
  zone: string
  source: string
  loudnessLufs: number
  peakDbfs: number
  phase: 'in-phase' | 'watch'
  confidence: 'stable' | 'warning'
}

export type SdiBridgeRecord = {
  id: number
  name: string
  siteId: number
  mode: 'SDI-IP' | 'IP-SDI' | 'hybrid'
  ioCount: string
  reference: 'PTP' | 'Black Burst' | 'Tri-level'
  status: 'online' | 'degraded' | 'offline'
}

export type ProductionSetupRecord = {
  id: number
  name: string
  productionType: 'sports' | 'news' | 'entertainment' | 'remote'
  status: 'draft' | 'ready' | 'live'
  siteId: number
  studioId: number
  mcrChainId: number
  multiviewLayout: string
  cameraCount: number
  audioProfile: string
  graphicsProfile: string
  redundancy: 'single' | 'protected' | 'dual-site'
  primaryRouteIds: number[]
  connectorIds: number[]
  notes: string
}

export type OrchestrateWorkflowRecord = {
  id: number
  name: string
  trigger: 'manual' | 'alarm' | 'schedule' | 'rundown'
  condition: string
  status: 'idle' | 'running' | 'armed' | 'error'
  lastRun: string
  steps: { command: string; durationSec: number }[]
}

export type OrchestrateMacroRecord = {
  id: number
  name: string
  trigger: 'manual' | 'alarm' | 'schedule'
  body: string[]
}

export type OrchestrateScheduleRecord = {
  id: number
  time: string
  workflowName: string
  days: string
  enabled: boolean
}

export type OrchestrateRuleRecord = {
  id: number
  trigger: string
  action: string
  enabled: boolean
}

export type OrchestrateLogRecord = {
  id: number
  timestamp: string
  scope: string
  message: string
  level: 'ok' | 'warn' | 'err'
}

export type ControlWorkspace = 'operator' | 'engineer' | 'admin' | 'trainee'

export type ControlPanelKind =
  | 'mosaic'
  | 'switcher'
  | 'shading'
  | 'audio-monitoring'
  | 'sdi-bridge'
  | 'orchestrate'
  | 'routing'
  | 'scenarios'
  | 'outside-broadcast'
  | 'virtual-studio'
  | 'production-monitoring'
  | 'manufacturer-catalog'
  | 'production-database'
  | 'master-control'
  | 'session'
  | 'active-site'
  | 'event-stream'
  | 'jobs'
  | 'orchestrate-log'
  | 'gpio'

export type ControlPanelRecord = {
  id: number
  workspace: ControlWorkspace
  zone: 'primary' | 'canvas' | 'sidebar'
  order: number
  kind: ControlPanelKind
  title: string
  summary: string
  enabled: boolean
}

export type ControlPageRecord = {
  id: number
  workspace: ControlWorkspace
  name: string
  layout: 'control-room' | 'engineering' | 'admin-grid' | 'training'
  panelIds: number[]
  active: boolean
}

export type SalvoRecord = {
  id: number
  name: string
  description: string
  mode: 'manual' | 'alarm' | 'schedule'
  routeIds: number[]
  connectorIds: number[]
  gpioPortIds: number[]
  tallyIds: number[]
}

export type TallyUmdRecord = {
  id: number
  label: string
  source: string
  destination: string
  program: boolean
  preview: boolean
  status: 'online' | 'warning'
}

export type BroadcastControlConfigRecord = {
  version: string
  pages: ControlPageRecord[]
  panels: ControlPanelRecord[]
  salvos: SalvoRecord[]
  tallies: TallyUmdRecord[]
}

export type PlatformSnapshot = {
  generatedAt: string
  facilities: string[]
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
  metrics: {
    onAirServices: number
    activeIncidents: number
    registeredNmosNodes: number
    protectedFlows: number
    gpioActive: number
    connectedSites: number
    connectedConnectors: number
    queuedJobs: number
    liveStudios: number
  }
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
  orchestrate: {
    workflows: OrchestrateWorkflowRecord[]
    macros: OrchestrateMacroRecord[]
    schedules: OrchestrateScheduleRecord[]
    rules: OrchestrateRuleRecord[]
    logs: OrchestrateLogRecord[]
    cloudMode: 'on-prem' | 'hybrid' | 'cloud'
  }
  controlConfig: BroadcastControlConfigRecord
}

export type SessionRecord = {
  name: string
  email: string
  role: UserRole
  tenantId: number
  siteId: number
}
