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
  type: 'NMOS' | 'GPIO' | 'Router' | 'Replay' | 'Cloud' | 'Audio'
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
  metrics: {
    onAirServices: number
    activeIncidents: number
    registeredNmosNodes: number
    protectedFlows: number
    gpioActive: number
    connectedSites: number
    connectedConnectors: number
    queuedJobs: number
  }
  equipment: EquipmentRecord[]
  nmosNodes: NmosNodeRecord[]
  nmosFlows: NmosFlowRecord[]
  gpioPorts: GpioRecord[]
  alerts: AlertRecord[]
  scenarios: ScenarioRecord[]
  runbooks: RunbookRecord[]
  events: EventRecord[]
}

export type SessionRecord = {
  name: string
  email: string
  role: UserRole
  tenantId: number
  siteId: number
}
